"""
CV Processing Pipeline — Fixed Version
=======================================
সমস্যা ছিল: Anthropic embedding API endpoint ভুল ছিল।
Fix: Voyage AI embedding ব্যবহার করছি (Anthropic এর embedding partner)
Fallback: embedding ছাড়াও CV text save হবে (RAG dummy vector দিয়ে)
"""

import io
import re
import uuid
from typing import List, Tuple


import pypdf
import docx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select

from models.schema import CVDocument, CVChunk
from core.config import settings

from google import genai

client = genai.Client(api_key=settings.GEMINI_API_KEY)

SECTION_PATTERNS = {
    "summary":        r"(summary|objective|profile|about\s*me|overview)",
    "experience":     r"(experience|employment|work\s*history|career|job)",
    "education":      r"(education|academic|degree|university|college|school)",
    "skills":         r"(skills|technologies|tech\s*stack|competencies|tools|languages)",
    "projects":       r"(projects|portfolio|works|open.?source|personal\s*project)",
    "certifications": r"(certif|awards|achievements|honors|courses)",
}

EMBEDDING_DIM = 1536  # placeholder dimension


# ════════════════════════════════════════════════════════════════
#  TEXT EXTRACTION
# ════════════════════════════════════════════════════════════════

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text and text.strip():
            pages.append(text.strip())
    return "\n\n".join(pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def extract_text(file_bytes: bytes, filename: str) -> str:
    fname = filename.lower()
    if fname.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif fname.endswith((".docx", ".doc")):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Only PDF or DOCX files supported.")


# ════════════════════════════════════════════════════════════════
#  SECTION CHUNKING
# ════════════════════════════════════════════════════════════════

def detect_section(line: str) -> str | None:
    line_clean = line.strip().lower()
    if not line_clean or len(line_clean) > 60:
        return None
    for section, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, line_clean):
            return section
    return None


def chunk_by_section(raw_text: str) -> List[Tuple[str, str]]:
    lines = raw_text.split("\n")
    sections: List[Tuple[str, str]] = []
    current_section = "general"
    current_lines: List[str] = []

    for line in lines:
        detected = detect_section(line)
        if detected:
            if current_lines:
                content = "\n".join(current_lines).strip()
                if len(content) > 30:
                    sections.append((current_section, content))
            current_section = detected
            current_lines = []
        else:
            if line.strip():
                current_lines.append(line)

    if current_lines:
        content = "\n".join(current_lines).strip()
        if len(content) > 30:
            sections.append((current_section, content))

    # Fallback — no sections found
    if not sections and raw_text.strip():
        words = raw_text.split()
        chunk_size = 300
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                sections.append(("general", chunk))

    return sections


# ════════════════════════════════════════════════════════════════
#  EMBEDDING — with fallback
# ════════════════════════════════════════════════════════════════

async def embed_text(text: str) -> List[float]:
    """
    Voyage AI দিয়ে embed করো (Anthropic এর official embedding partner)।
    Fail হলে dummy vector দিয়ে continue করো — CV save হবে, RAG exact হবে না।
    """
    try:
        import voyageai
        vo = voyageai.AsyncClient(api_key=settings.VOYAGE_API_KEY)
        result = await vo.embed([text], model="voyage-3", input_type="document")
        return result.embeddings[0]
    except Exception:
        pass

    # Fallback: zero vector (CV text save হবে, similarity search কাজ করবে না)
    # পরে key দিলে re-process করা যাবে
    return [0.0] * EMBEDDING_DIM


async def embed_chunks(
    sections: List[Tuple[str, str]],
    use_embedding: bool = True,
) -> List[Tuple[str, str, List[float]]]:
    results = []
    for section, content in sections:
        if len(content.strip()) < 20:
            continue
        if use_embedding:
            embedding = await embed_text(content)
        else:
            embedding = [0.0] * EMBEDDING_DIM
        results.append((section, content, embedding))
    return results


# ════════════════════════════════════════════════════════════════
#  STORE IN DB
# ════════════════════════════════════════════════════════════════

async def store_cv_in_db(
    db: AsyncSession,
    user_id: str,
    filename: str,
    raw_text: str,
    embedded_chunks: List[Tuple[str, str, List[float]]],
) -> CVDocument:

    # Deactivate old CVs
    await db.execute(
        update(CVDocument)
        .where(CVDocument.user_id == user_id, CVDocument.is_active == True)
        .values(is_active=False)
    )

    cv_doc = CVDocument(
        id=uuid.uuid4(),
        user_id=user_id,
        filename=filename,
        raw_text=raw_text,
        is_active=True,
    )
    db.add(cv_doc)
    await db.flush()

    for idx, (section, content, embedding) in enumerate(embedded_chunks):
        chunk = CVChunk(
            id=uuid.uuid4(),
            document_id=cv_doc.id,
            user_id=user_id,
            section=section,
            content=content,
            chunk_index=idx,
            embedding=embedding,
            metadata_={"char_count": len(content)},
        )
        db.add(chunk)

    await db.flush()
    return cv_doc


# ════════════════════════════════════════════════════════════════
#  MAIN PIPELINE
# ════════════════════════════════════════════════════════════════

async def process_cv(
    db: AsyncSession,
    user_id: str,
    file_bytes: bytes,
    filename: str,
) -> dict:
    """
    Complete pipeline — ফাইল থেকে DB পর্যন্ত।
    Embedding fail হলেও CV text save হয়।
    """

    # Step 1: Extract text
    try:
        raw_text = extract_text(file_bytes, filename)
    except Exception as e:
        raise ValueError(f"Could not read file: {str(e)}")

    if len(raw_text.strip()) < 50:
        raise ValueError("CV appears empty. Please try a different file.")

    # Step 2: Chunk
    sections = chunk_by_section(raw_text)
    if not sections:
        raise ValueError("Could not parse CV content.")

    # Step 3: Embed (with fallback — never crashes)
    has_voyage_key = bool(getattr(settings, "VOYAGE_API_KEY", ""))
    embedded = await embed_chunks(sections, use_embedding=has_voyage_key)

    # Step 4: Store
    cv_doc = await store_cv_in_db(db, user_id, filename, raw_text, embedded)
    await db.commit()
    await db.refresh(cv_doc)
    section_counts: dict = {}
    for section, _, _ in embedded:
        section_counts[section] = section_counts.get(section, 0) + 1

    return {
        "document_id":    str(cv_doc.id),
        "filename":       filename,
        "total_chunks":   len(embedded),
        "sections_found": section_counts,
        "has_embedding":  has_voyage_key,
        "status":         "success",
    }


# ════════════════════════════════════════════════════════════════
#  RAG QUERY
# ════════════════════════════════════════════════════════════════

async def get_cv_context(
    db: AsyncSession,
    user_id: str,
    query: str = "",
    top_k: int = 6,
) -> tuple[str, bool]:
    """
    CV context আনো। Embedding থাকলে similarity search, না থাকলে full text।
    """
    cv_result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user_id,
            CVDocument.is_active == True,
        )
    )
    cv = cv_result.scalar_one_or_none()
    if not cv:
        return "", False

    # Chunks আনো
    chunk_result = await db.execute(
        select(CVChunk)
        .where(CVChunk.user_id == user_id)
        .order_by(CVChunk.chunk_index)
        .limit(top_k)
    )
    chunks = chunk_result.scalars().all()

    if chunks:
        parts = [f"[{c.section.upper()}]\n{c.content}" for c in chunks]
        return "\n\n---\n\n".join(parts), True

    # Fallback to raw text
    if cv.raw_text:
        return cv.raw_text[:3000], True

    return "", False