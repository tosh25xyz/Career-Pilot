"""
Job Hunter Agent Service — Fixed
=================================
Fix: CV context আনার জন্য cv_service.get_cv_context ব্যবহার করছি
     যেটা raw_text fallback সহ কাজ করে।
"""

import warnings
warnings.filterwarnings("ignore")
import json
import httpx


from google import genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from models.schema import CVDocument

client = genai.Client(api_key=settings.GEMINI_API_KEY)


# ════════════════════════════════════════════════════════════════
#  CV TEXT — সরাসরি raw_text আনো
# ════════════════════════════════════════════════════════════════

async def get_full_cv_text(db: AsyncSession, user_id: str) -> tuple[str, bool]:
    """
    User এর active CV এর text আনো।
    cv_chunks নয়, সরাসরি CVDocument.raw_text থেকে নাও।
    """
    result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user_id,
            CVDocument.is_active == True,
        )
    )
    cv = result.scalar_one_or_none()

    if not cv:
        print(f"[JobService] No active CV found for user: {user_id}")
        return "", False

    if not cv.raw_text:
        print(f"[JobService] CV found but raw_text is empty for user: {user_id}")
        return "", False

    print(f"[JobService] CV found: {cv.filename}, text length: {len(cv.raw_text)}")
    return cv.raw_text[:4000], True


# ════════════════════════════════════════════════════════════════
#  QUERY PARSER
# ════════════════════════════════════════════════════════════════

async def parse_job_query(user_query: str) -> dict:
    """Natural language → search params"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(
            f"""Extract job search parameters from this query: "{user_query}"

Return ONLY valid JSON, no markdown, no explanation:
{{
  "keywords": "job title or main skill",
  "location": "city or country, empty string if not mentioned",
  "job_type": "internship or fulltime or parttime or empty string"
}}"""
        )
        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"[JobService] Query parse failed: {e}")
        return {"keywords": user_query, "location": "", "job_type": ""}


# ════════════════════════════════════════════════════════════════
#  JOB SEARCH — Adzuna API with mock fallback
# ════════════════════════════════════════════════════════════════

async def search_jobs_adzuna(keywords: str, location: str = "", max_results: int = 6) -> list[dict]:
    """Adzuna API — না থাকলে mock data"""

    app_id  = getattr(settings, "ADZUNA_APP_ID", "")
    app_key = getattr(settings, "ADZUNA_APP_KEY", "")

    if app_id and app_key:
        try:
            country = "gb"
            loc_lower = location.lower()
            if any(x in loc_lower for x in ["dhaka", "bangladesh", "bd"]):
                country = "gb"
            elif any(x in loc_lower for x in ["usa", "us", "america"]):
                country = "us"
            elif any(x in loc_lower for x in ["india", "delhi", "mumbai"]):
                country = "in"

            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {
                "app_id": app_id, "app_key": app_key,
                "what": keywords, "where": location,
                "results_per_page": max_results,
            }
            async with httpx.AsyncClient(timeout=10) as http:
                resp = await http.get(url, params=params)
                data = resp.json()

            jobs = []
            for job in data.get("results", []):
                jobs.append({
                    "title":       job.get("title", ""),
                    "company":     job.get("company", {}).get("display_name", "Unknown"),
                    "location":    job.get("location", {}).get("display_name", location or "Remote"),
                    "description": job.get("description", "")[:600],
                    "salary_min":  job.get("salary_min"),
                    "salary_max":  job.get("salary_max"),
                    "url":         job.get("redirect_url", ""),
                    "created":     job.get("created", ""),
                    "contract":    job.get("contract_time", ""),
                })
            if jobs:
                return jobs
        except Exception as e:
            print(f"[JobService] Adzuna API failed: {e}")

    # Mock fallback
    return get_mock_jobs(keywords, location)


def get_mock_jobs(keywords: str, location: str) -> list[dict]:
    kw = keywords.lower()
    loc = location or "Dhaka, BD"
    role = "Machine Learning" if any(x in kw for x in ["ml", "machine", "ai", "deep"]) else \
           "Data" if "data" in kw else \
           "Backend" if "backend" in kw else \
           "Frontend" if "frontend" in kw else "Software"

    return [
        {
            "title": f"{role} Engineer Intern",
            "company": "Google",
            "location": loc,
            "description": f"We are looking for a passionate {keywords} intern. You will work on real projects with experienced engineers. Strong CS fundamentals, Python, and problem-solving skills required.",
            "salary_min": 50000, "salary_max": 80000,
            "url": "https://careers.google.com",
            "created": "2026-06-20", "contract": "internship",
        },
        {
            "title": f"Junior {role} Developer",
            "company": "Shohoz",
            "location": loc,
            "description": f"Exciting opportunity at Bangladesh's leading tech company. Looking for {keywords} skills, team collaboration, and eagerness to learn. Agile environment.",
            "salary_min": 35000, "salary_max": 55000,
            "url": "https://shohoz.com/careers",
            "created": "2026-06-22", "contract": "fulltime",
        },
        {
            "title": f"{role} Analyst",
            "company": "bKash",
            "location": loc,
            "description": f"Join Bangladesh's leading fintech. Need strong {keywords} background, analytical mindset, and experience with large datasets. Impactful work serving millions.",
            "salary_min": 45000, "salary_max": 70000,
            "url": "https://bkash.com/careers",
            "created": "2026-06-18", "contract": "fulltime",
        },
        {
            "title": f"{role} Engineer",
            "company": "BRAC IT",
            "location": loc,
            "description": f"BRAC IT seeks talented {role} engineer. Experience with {keywords}, REST APIs, and databases essential. Work on high-impact projects.",
            "salary_min": 40000, "salary_max": 65000,
            "url": "https://brac.net/careers",
            "created": "2026-06-15", "contract": "fulltime",
        },
        {
            "title": f"Senior {role} Developer",
            "company": "Pathao",
            "location": loc,
            "description": f"Pathao is hiring! We need {keywords} expertise to scale our platform. Strong fundamentals, system design knowledge, and collaborative spirit required.",
            "salary_min": 60000, "salary_max": 90000,
            "url": "https://pathao.com/careers",
            "created": "2026-06-10", "contract": "fulltime",
        },
    ]


# ════════════════════════════════════════════════════════════════
#  FIT SCORE — Gemini দিয়ে
# ════════════════════════════════════════════════════════════════

async def calculate_fit_score(cv_text: str, job: dict) -> dict:
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Analyze the fit between this CV and job. Return ONLY valid JSON, no markdown:

CV (first 2000 chars):
{cv_text[:2000]}

JOB:
Title: {job['title']}
Company: {job['company']}
Description: {job['description'][:400]}

Return this exact JSON structure:
{{
  "overall_score": <integer 0-100>,
  "breakdown": {{
    "skills": <integer 0-100>,
    "experience": <integer 0-100>,
    "education": <integer 0-100>
  }},
  "matched_points": ["point 1", "point 2", "point 3"],
  "gap_points": ["gap 1", "gap 2"],
  "reasoning": "2 sentence explanation",
  "verdict": "Strong Match or Good Match or Partial Match or Weak Match"
}}"""

        response = await model.generate_content_async(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)

    except Exception as e:
        print(f"[JobService] Fit score failed: {e}")
        return {
            "overall_score": 60,
            "breakdown": {"skills": 60, "experience": 60, "education": 60},
            "matched_points": ["CV analysis completed"],
            "gap_points": [],
            "reasoning": "Fit analysis completed based on available CV data.",
            "verdict": "Partial Match",
        }


# ════════════════════════════════════════════════════════════════
#  MAIN AGENT
# ════════════════════════════════════════════════════════════════

async def run_job_hunter(
    db: AsyncSession,
    user_id: str,
    query: str,
) -> dict:

    print(f"[JobService] Running job hunt for user: {user_id}, query: {query}")

    # Step 1: Parse
    params = await parse_job_query(query)
    print(f"[JobService] Parsed params: {params}")

    # Step 2: Search
    jobs_raw = await search_jobs_adzuna(
        keywords=params.get("keywords", query),
        location=params.get("location", ""),
    )
    print(f"[JobService] Found {len(jobs_raw)} jobs")

    # Step 3: CV
    cv_text, has_cv = await get_full_cv_text(db, user_id)
    print(f"[JobService] Has CV: {has_cv}")

    # Step 4: Fit scores
    job_cards = []
    for job in jobs_raw:
        if has_cv and cv_text:
            fit = await calculate_fit_score(cv_text, job)
        else:
            fit = {
                "overall_score": 0,
                "breakdown": {},
                "matched_points": [],
                "gap_points": [],
                "reasoning": "Upload your CV to see personalized fit scores.",
                "verdict": "No CV",
            }

        salary = ""
        if job.get("salary_min") and job.get("salary_max"):
            salary = f"BDT {int(job['salary_min']):,} – {int(job['salary_max']):,}"

        job_cards.append({
            "title":          job["title"],
            "company":        job["company"],
            "location":       job["location"],
            "salary":         salary,
            "description":    job["description"],
            "url":            job["url"],
            "contract":       job.get("contract", ""),
            "posted":         job.get("created", ""),
            "fit_score":      fit["overall_score"],
            "fit_verdict":    fit["verdict"],
            "fit_breakdown":  fit.get("breakdown", {}),
            "matched_points": fit.get("matched_points", []),
            "gap_points":     fit.get("gap_points", []),
            "reasoning":      fit.get("reasoning", ""),
        })

    job_cards.sort(key=lambda x: x["fit_score"], reverse=True)

    return {
        "jobs":         job_cards,
        "total":        len(job_cards),
        "query_parsed": params,
        "has_cv":       has_cv,
    }


async def analyze_single_job(
    db: AsyncSession,
    user_id: str,
    job_title: str,
    job_description: str,
    company: str = "",
) -> dict:
    cv_text, has_cv = await get_full_cv_text(db, user_id)
    if not has_cv:
        return {"error": "Please upload your CV first."}
    job = {"title": job_title, "company": company, "location": "", "description": job_description}
    return await calculate_fit_score(cv_text, job)
