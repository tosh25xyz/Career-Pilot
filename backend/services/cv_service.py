"""
CV Processing Pipeline
======================
PDF/DOCX  →  Raw Text  →  Section Chunks  →  Embeddings  →  pgvector

Flow:
  1. extract_text()       — PDF বা DOCX থেকে plain text বের করো
  2. chunk_by_section()   — Experience / Skills / Education / Projects আলাদা করো
  3. embed_chunks()       — Anthropic embedding API দিয়ে vector বানাও
  4. store_in_pgvector()  — Database এ save করো
"""

import io
import re
import uuid
from typing import List, Tuple

import anthropic
import pypdf
import docx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from models.schema import CVDocument, CVChunk
from core.config import settings

# ── Anthropic client ────────────────────────────────────────────
client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

# ── Section keywords (case-insensitive) ─────────────────────────
SECTION_PATTERNS = {
    "summary":    r"(summary|objective|profile|about me)",
    "experience": r"(experience|employment|work history|career)",
    "education":  r"(education|academic|degree|university|college)",
    "skills":     r"(skills|technologies|tech stack|competencies|tools)",
    "projects":   r"(projects|portfolio|works|open.?source)",
    "certifications": r"(certif|awards|achievements|honors)",
}

CHUNK_SIZE   = 400   # tokens approx (chars / 4)
CHUNK_OVERLAP = 50


# ════════════════════════════════════════════════════════════════
#  1. TEXT EXTRACTION
# ════════════════════════════════════════════════════════════════

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """PDF থেকে সব text বের করো।"""
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """DOCX থেকে সব paragraph বের করো।"""
    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def extract_text(file_bytes: bytes, filename: str) -> str:
    """File type detect করে সঠিক extractor call করো।"""
    fname = filename.lower()
    if fname.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif fname.endswith(".docx") or fname.endswith(".doc"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}. Use PDF or DOCX.")


# ════════════════════════════════════════════════════════════════
#  2. SECTION DETECTION & CHUNKING
# ════════════════════════════════════════════════════════════════

def detect_section(line: str) -> str | None:
    """একটা line কোন section header কিনা বোঝো।"""
    line_clean = line.strip().lower()
    # Header হলে সাধারণত ছোট (< 60 chars) এবং একটা pattern match করে
    if len(line_clean) > 60:
        return None
    for section, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, line_clean):
            return section
    return None


def chunk_by_section(raw_text: str) -> List[Tuple[str, str]]:
    """
    CV text কে section অনুযায়ী ভাগ করো।
    Returns: list of (section_name, content)
    """
    lines = raw_text.split("\n")
    sections: List[Tuple[str, str]] = []
    current_section = "general"
    current_lines: List[str] = []

    for line in lines:
        detected = detect_section(line)
        if detected:
            # আগের section save করো
            if current_lines:
                content = "\n".join(current_lines).strip()
                if content:
                    sections.append((current_section, content))
            current_section = detected
            current_lines = []
        else:
            if line.strip():
                current_lines.append(line)

    # শেষ section
    if current_lines:
        content = "\n".join(current_lines).strip()
        if content:
            sections.append((current_section, content))

    # যদি কোনো section detect না হয়, পুরো text কে chunk করো
    if not sections:
        sections = split_into_chunks(raw_text)

    return sections


def split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE) -> List[Tuple[str, str]]:
    """
    Section detect না হলে fixed-size chunks বানাও।
    (fallback method)
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - CHUNK_OVERLAP):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(("general", chunk))
    return chunks


# ════════════════════════════════════════════════════════════════
#  3. EMBEDDING GENERATION
# ════════════════════════════════════════════════════════════════

async def embed_text(text: str) -> List[float]:
    """
    Anthropic দিয়ে text embed করো।
    Note: Anthropic এর embedding model 'voyage-3' ব্যবহার করে।
    """
    # Anthropic এর embedding endpoint
    response = await client.post(
        "/v1/embeddings",
        json={
            "model": "voyage-3",
            "input": text,
        }
    )
    data = response.json()
    return data["data"][0]["embedding"]


async def embed_chunks(chunks: List[Tuple[str, str]]) -> List[Tuple[str, str, List[float]]]:
    """
    সব chunks embed করো।
    Returns: list of (section, content, embedding_vector)
    """
    results = []
    for section, content in chunks:
        # খুব ছোট chunks skip করো
        if len(content.strip()) < 20:
            continue
        embedding = await embed_text(content)
        results.append((section, content, embedding))
    return results


# ════════════════════════════════════════════════════════════════
#  4. STORE IN PGVECTOR
# ════════════════════════════════════════════════════════════════

async def store_cv_in_db(
    db: AsyncSession,
    user_id: str,
    filename: str,
    raw_text: str,
    embedded_chunks: List[Tuple[str, str, List[float]]],
) -> CVDocument:
    """
    CV document এবং সব chunks database এ save করো।
    পুরনো active CV deactivate করো।
    """

    # আগের active CV deactivate করো
    await db.execute(
        update(CVDocument)
        .where(CVDocument.user_id == user_id, CVDocument.is_active == True)
        .values(is_active=False)
    )

    # নতুন CVDocument তৈরি করো
    cv_doc = CVDocument(
        id=uuid.uuid4(),
        user_id=user_id,
        filename=filename,
        raw_text=raw_text,
        is_active=True,
    )
    db.add(cv_doc)
    await db.flush()  # ID generate হবে

    # Chunks save করো
    for idx, (section, content, embedding) in enumerate(embedded_chunks):
        chunk = CVChunk(
            id=uuid.uuid4(),
            document_id=cv_doc.id,
            user_id=user_id,
            section=section,
            content=content,
            chunk_index=idx,
            embedding=embedding,
            metadata_={"char_count": len(content), "word_count": len(content.split())},
        )
        db.add(chunk)

    await db.flush()
    return cv_doc


# ════════════════════════════════════════════════════════════════
#  5. RAG QUERY — downstream agents এটা use করবে
# ════════════════════════════════════════════════════════════════

async def query_cv(
    db: AsyncSession,
    user_id: str,
    query: str,
    top_k: int = 5,
) -> List[CVChunk]:
    """
    User এর CV থেকে query র সাথে সবচেয়ে relevant chunks খোঁজো।
    pgvector cosine similarity ব্যবহার করে।
    """
    # Query embed করো
    query_embedding = await embed_text(query)

    # pgvector cosine similarity search
    # <=> operator = cosine distance (ছোট = বেশি similar)
    result = await db.execute(
        """
        SELECT * FROM cv_chunks
        WHERE user_id = :user_id
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
        """,
        {
            "user_id": user_id,
            "embedding": query_embedding,
            "top_k": top_k,
        }
    )
    return result.fetchall()


async def get_cv_context(
    db: AsyncSession,
    user_id: str,
    query: str,
    top_k: int = 5,
) -> str:
    """
    RAG context string তৈরি করো — AI Assistant এটা system prompt এ পাবে।
    """
    chunks = await query_cv(db, user_id, query, top_k)
    if not chunks:
        return "No CV found. Ask the user to upload their CV first."

    context_parts = []
    for chunk in chunks:
        context_parts.append(f"[{chunk.section.upper()}]\n{chunk.content}")

    return "\n\n---\n\n".join(context_parts)


# ════════════════════════════════════════════════════════════════
#  6. MAIN PIPELINE — সব একসাথে
# ════════════════════════════════════════════════════════════════

async def process_cv(
    db: AsyncSession,
    user_id: str,
    file_bytes: bytes,
    filename: str,
) -> dict:
    """
    Complete CV pipeline:
    file → text → chunks → embeddings → database

    Returns summary of what was processed.
    """
    # Step 1: Text extract
    raw_text = extract_text(file_bytes, filename)
    if len(raw_text.strip()) < 50:
        raise ValueError("CV seems empty or could not be read. Try a different file.")

    # Step 2: Section chunking
    sections = chunk_by_section(raw_text)

    # Step 3: Embed all chunks
    embedded = await embed_chunks(sections)

    # Step 4: Store in DB
    cv_doc = await store_cv_in_db(db, user_id, filename, raw_text, embedded)

    # Summary
    section_counts: dict = {}
    for section, _, _ in embedded:
        section_counts[section] = section_counts.get(section, 0) + 1

    return {
        "document_id": str(cv_doc.id),
        "filename": filename,
        "total_chunks": len(embedded),
        "sections_found": section_counts,
        "raw_text_length": len(raw_text),
        "status": "success",
    }
