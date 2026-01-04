"""
Singh Automation Platform - API Endpoints
FastAPI routes for proposal generation and data access

Usage:
    uvicorn platform_api:app --reload --port 8000

Endpoints:
    GET  /api/company              - Company profile
    GET  /api/certifications       - Active certifications
    GET  /api/personnel            - All personnel
    GET  /api/personnel/{role}     - Personnel by proposal role
    GET  /api/past-performance     - All usable past performance
    GET  /api/past-performance/search?tags=welding,robotics
    GET  /api/verification-status  - What needs verification
    POST /api/proposal/generate    - Generate proposal content
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime

app = FastAPI(
    title="Singh Automation Proposal Platform",
    description="API for automated proposal generation",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "singh_platform.db"


def get_db():
    """Get database connection with row factory."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def dict_from_row(row):
    """Convert sqlite3.Row to dict."""
    return dict(row) if row else None


# =============================================================================
# MODELS
# =============================================================================

class ProposalRequest(BaseModel):
    solicitation_number: str
    title: str
    agency: str
    naics: str
    estimated_value: Optional[float] = None
    tags: Optional[List[str]] = []
    personnel_roles: Optional[List[str]] = None


class OpportunitySubmission(BaseModel):
    title: str
    solicitation_number: Optional[str] = None
    source_portal: str
    posting_url: str
    submission_method: str  # EMAIL, PORTAL, MAIL
    submission_email: Optional[str] = None
    portal_url: Optional[str] = None
    proposal_due: str
    co_name: Optional[str] = None
    co_email: Optional[str] = None


# =============================================================================
# COMPANY ENDPOINTS
# =============================================================================

@app.get("/api/company")
def get_company_profile():
    """Get company profile and boilerplate."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM company_profile WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Company profile not found")
    
    return dict_from_row(row)


# =============================================================================
# CERTIFICATION ENDPOINTS
# =============================================================================

@app.get("/api/certifications")
def get_certifications(active_only: bool = True):
    """Get certifications. By default, only returns active/claimable ones."""
    conn = get_db()
    cursor = conn.cursor()
    
    if active_only:
        cursor.execute("SELECT * FROM v_active_certifications")
    else:
        cursor.execute("SELECT * FROM certifications ORDER BY status, cert_name")
    
    rows = cursor.fetchall()
    conn.close()
    
    return {"certifications": [dict_from_row(r) for r in rows]}


# =============================================================================
# PERSONNEL ENDPOINTS
# =============================================================================

@app.get("/api/personnel")
def get_all_personnel():
    """Get all active personnel."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM v_available_personnel")
    rows = cursor.fetchall()
    conn.close()
    
    return {"personnel": [dict_from_row(r) for r in rows]}


@app.get("/api/personnel/role/{role}")
def get_personnel_by_role(role: str):
    """Get personnel matching a proposal role."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM key_personnel WHERE proposal_role LIKE ? AND employment_status = 'ACTIVE'",
        (f"%{role}%",)
    )
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail=f"No personnel found for role: {role}")
    
    return {"personnel": [dict_from_row(r) for r in rows]}


# =============================================================================
# PAST PERFORMANCE ENDPOINTS
# =============================================================================

@app.get("/api/past-performance")
def get_past_performance():
    """Get all usable past performance (verified or partial)."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM v_usable_past_performance")
    rows = cursor.fetchall()
    conn.close()
    
    return {"past_performance": [dict_from_row(r) for r in rows]}


@app.get("/api/past-performance/search")
def search_past_performance(
    tags: str = Query(None, description="Comma-separated keywords"),
    naics: str = Query(None, description="NAICS code to match"),
    min_value: float = Query(None, description="Minimum contract value"),
    limit: int = Query(3, description="Max results")
):
    """Search past performance by tags, NAICS, and value."""
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT * FROM past_performance 
        WHERE verification_status IN ('VERIFIED', 'PARTIAL')
    """
    params = []
    
    if tags:
        tag_list = [t.strip() for t in tags.split(',')]
        tag_conditions = " OR ".join(["keywords LIKE ?" for _ in tag_list])
        query += f" AND ({tag_conditions})"
        params.extend([f"%{t}%" for t in tag_list])
    
    if naics:
        query += " AND naics_codes LIKE ?"
        params.append(f"%{naics}%")
    
    if min_value:
        query += " AND contract_value >= ?"
        params.append(min_value)
    
    query += " ORDER BY contract_value DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Calculate relevance scores
    results = []
    for row in rows:
        result = dict_from_row(row)
        if tags:
            tag_list = [t.strip().lower() for t in tags.split(',')]
            keywords = (result.get('keywords') or '').lower()
            matched = sum(1 for t in tag_list if t in keywords)
            result['relevance_score'] = matched / len(tag_list) if tag_list else 0
            result['matched_tags'] = [t for t in tag_list if t in keywords]
        results.append(result)
    
    return {"matches": results}


# =============================================================================
# VERIFICATION STATUS ENDPOINT
# =============================================================================

@app.get("/api/verification-status")
def get_verification_status():
    """Get all items that need verification."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM v_verification_dashboard")
    rows = cursor.fetchall()
    conn.close()
    
    issues = [dict_from_row(r) for r in rows]
    
    return {
        "needs_attention": len(issues),
        "issues": issues,
        "summary": {
            "past_performance": len([i for i in issues if i['category'] == 'Past Performance']),
            "certifications": len([i for i in issues if i['category'] == 'Certification']),
            "personnel": len([i for i in issues if i['category'] == 'Personnel'])
        }
    }


# =============================================================================
# OPPORTUNITY ENDPOINTS
# =============================================================================

@app.get("/api/opportunities")
def get_opportunities(status: str = Query(None)):
    """Get tracked opportunities."""
    conn = get_db()
    cursor = conn.cursor()
    
    if status:
        cursor.execute("SELECT * FROM opportunities WHERE status = ? ORDER BY proposal_due", (status,))
    else:
        cursor.execute("SELECT * FROM opportunities ORDER BY proposal_due")
    
    rows = cursor.fetchall()
    conn.close()
    
    return {"opportunities": [dict_from_row(r) for r in rows]}


@app.post("/api/opportunities")
def create_opportunity(opp: OpportunitySubmission):
    """Add a new opportunity with submission details."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO opportunities (
            title, solicitation_number, source_portal, posting_url,
            submission_method, submission_email, portal_url,
            proposal_due, co_name, co_email, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IDENTIFIED')
    """, (
        opp.title, opp.solicitation_number, opp.source_portal, opp.posting_url,
        opp.submission_method, opp.submission_email, opp.portal_url,
        opp.proposal_due, opp.co_name, opp.co_email
    ))
    
    conn.commit()
    opp_id = cursor.lastrowid
    conn.close()
    
    return {"id": opp_id, "status": "created"}


# =============================================================================
# PROPOSAL GENERATION ENDPOINT
# =============================================================================

@app.post("/api/proposal/generate")
def generate_proposal(req: ProposalRequest):
    """Generate proposal content from database."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get company profile
    cursor.execute("SELECT * FROM company_profile WHERE id = 1")
    company = dict_from_row(cursor.fetchone())
    
    # Get matched past performance
    past_perf = []
    if req.tags:
        tag_conditions = " OR ".join(["keywords LIKE ?" for _ in req.tags])
        cursor.execute(f"""
            SELECT * FROM past_performance 
            WHERE verification_status IN ('VERIFIED', 'PARTIAL')
            AND ({tag_conditions})
            ORDER BY contract_value DESC LIMIT 3
        """, [f"%{t}%" for t in req.tags])
        past_perf = [dict_from_row(r) for r in cursor.fetchall()]
    
    # Get personnel
    personnel_roles = req.personnel_roles or ['Project Manager', 'Controls Engineer', 'Operations Lead']
    personnel = []
    for role in personnel_roles:
        cursor.execute(
            "SELECT * FROM key_personnel WHERE proposal_role LIKE ? AND employment_status = 'ACTIVE' LIMIT 1",
            (f"%{role}%",)
        )
        row = cursor.fetchone()
        if row:
            personnel.append(dict_from_row(row))
    
    # Get active certifications
    cursor.execute("SELECT * FROM v_active_certifications")
    certs = [dict_from_row(r) for r in cursor.fetchall()]
    
    # Build verification warnings
    warnings = []
    for pp in past_perf:
        if not pp.get('contract_value_verified'):
            warnings.append(f"Past Perf '{pp['project_name']}': Contract value unverified")
        if not pp.get('outcomes_verified'):
            warnings.append(f"Past Perf '{pp['project_name']}': Outcomes unverified")
        if not pp.get('ref_approved'):
            warnings.append(f"Past Perf '{pp['project_name']}': Reference approval pending")
    
    for p in personnel:
        if not p.get('resume_on_file'):
            warnings.append(f"Personnel '{p['full_name']}': Resume not on file")
    
    conn.close()
    
    return {
        "metadata": {
            "solicitation_number": req.solicitation_number,
            "title": req.title,
            "agency": req.agency,
            "naics": req.naics,
            "generated_at": datetime.now().isoformat()
        },
        "company": {
            "name": company.get('legal_name'),
            "cage": company.get('cage_code'),
            "uei": company.get('uei'),
            "hq_address": f"{company.get('hq_street')}, {company.get('hq_city')}, {company.get('hq_state')} {company.get('hq_zip')}",
            "elevator_pitch": company.get('elevator_pitch'),
            "company_overview": company.get('company_overview')
        },
        "past_performance": past_perf,
        "personnel": personnel,
        "certifications": certs,
        "warnings": warnings,
        "verification_required": len(warnings) > 0
    }


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM past_performance")
        count = cursor.fetchone()[0]
        conn.close()
        return {"status": "healthy", "database": "connected", "past_performance_count": count}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# =============================================================================
# RUN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
