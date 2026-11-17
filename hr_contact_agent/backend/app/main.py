import csv
import io
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc, asc

from app.database import get_db, init_db
from app.models import Contact
from app.schemas import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactBulkRequest,
    ContactBulkResponse,
    StatsResponse,
    HealthResponse
)
from app.collector import (
    normalize_email,
    is_valid_email_syntax,
    classify_email_type,
    extract_domain
)

# Initialize FastAPI application
app = FastAPI(
    title="HR Contact Collection Agent API",
    description="Backend API for managing, deduplicating, reviewing, and exporting HR contacts collected from job portals.",
    version="1.0.0"
)

# Configure CORS for Dashboard and Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initialize database tables on server startup."""
    init_db()


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint matching specification."""
    return {"status": "ok", "service": "hr-contact-agent"}


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Return contact statistics for the dashboard cards."""
    total = db.query(Contact).count()
    verified = db.query(Contact).filter(Contact.verification_status == "verified").count()
    unverified = db.query(Contact).filter(Contact.verification_status == "unverified").count()
    invalid = db.query(Contact).filter(Contact.verification_status == "invalid").count()
    not_found = db.query(Contact).filter(Contact.verification_status == "not_found").count()
    
    generic = db.query(Contact).filter(Contact.email_type == "generic").count()
    person_or_other = db.query(Contact).filter(Contact.email_type == "person_or_other").count()
    
    reviewed = db.query(Contact).filter(Contact.reviewed == True).count()
    needs_review = total - reviewed
    
    return {
        "total": total,
        "verified": verified,
        "unverified": unverified,
        "invalid": invalid,
        "not_found": not_found,
        "generic": generic,
        "person_or_other": person_or_other,
        "reviewed": reviewed,
        "needs_review": needs_review
    }


@app.get("/api/contacts", response_model=List[ContactResponse])
def get_contacts(
    q: Optional[str] = Query(None, description="Search query across company, contact, job title, email, notes"),
    verification_status: Optional[str] = Query(None, description="Filter by status: unverified, verified, invalid, not_found"),
    email_type: Optional[str] = Query(None, description="Filter by email type: generic, person_or_other"),
    reviewed: Optional[bool] = Query(None, description="Filter by review status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, updated_at, company_name, email"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db)
):
    """Retrieve filtered, searched, and sorted contacts."""
    query = db.query(Contact)
    
    # Text search
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Contact.company_name.ilike(search_pattern),
                Contact.contact_name.ilike(search_pattern),
                Contact.job_title.ilike(search_pattern),
                Contact.email.ilike(search_pattern),
                Contact.email_normalized.ilike(search_pattern),
                Contact.source_domain.ilike(search_pattern),
                Contact.notes.ilike(search_pattern)
            )
        )
        
    # Filters
    if verification_status and verification_status != "all":
        query = query.filter(Contact.verification_status == verification_status)
        
    if email_type and email_type != "all":
        query = query.filter(Contact.email_type == email_type)
        
    if reviewed is not None:
        query = query.filter(Contact.reviewed == reviewed)
        
    # Sorting
    sort_col = getattr(Contact, sort_by, Contact.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))
        
    contacts = query.offset(skip).limit(limit).all()
    return contacts


@app.post("/api/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_or_upsert_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    """
    Creates or updates a contact based on normalized email deduplication.
    Normalizes email, checks syntax, classifies email type, extracts domain.
    """
    normalized = normalize_email(contact_in.email)
    if not normalized:
        raise HTTPException(status_code=400, detail="Valid email address is required.")
        
    # Determine validity and verification status
    is_valid = is_valid_email_syntax(normalized)
    computed_status = contact_in.verification_status or ("unverified" if is_valid else "invalid")
    computed_type = contact_in.email_type or classify_email_type(normalized)
    
    domain = contact_in.source_domain
    if not domain and contact_in.source_url:
        domain = extract_domain(contact_in.source_url)
        
    # Deduplication check
    existing = db.query(Contact).filter(Contact.email_normalized == normalized).first()
    if existing:
        # Update existing record if new info is richer
        if contact_in.company_name and (not existing.company_name or len(existing.company_name) < len(contact_in.company_name)):
            existing.company_name = contact_in.company_name.strip()
            
        if contact_in.contact_name and not existing.contact_name:
            existing.contact_name = contact_in.contact_name.strip()
            
        if contact_in.job_title and (not existing.job_title or len(existing.job_title) < len(contact_in.job_title)):
            existing.job_title = contact_in.job_title.strip()
            
        if contact_in.source_url and not existing.source_url:
            existing.source_url = contact_in.source_url.strip()
            
        if domain and not existing.source_domain:
            existing.source_domain = domain
            
        if contact_in.notes:
            existing.notes = (existing.notes + "\n" + contact_in.notes).strip() if existing.notes else contact_in.notes
            
        if contact_in.reviewed is not None and contact_in.reviewed is True:
            existing.reviewed = True
            
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    # Create new contact
    new_contact = Contact(
        company_name=contact_in.company_name.strip() if contact_in.company_name else None,
        contact_name=contact_in.contact_name.strip() if contact_in.contact_name else None,
        job_title=contact_in.job_title.strip() if contact_in.job_title else None,
        email=contact_in.email.strip(),
        email_normalized=normalized,
        source_url=contact_in.source_url.strip() if contact_in.source_url else None,
        source_domain=domain,
        verification_status=computed_status,
        email_type=computed_type,
        reviewed=contact_in.reviewed or False,
        notes=contact_in.notes.strip() if contact_in.notes else None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


@app.post("/api/contacts/batch", response_model=ContactBulkResponse)
def batch_create_contacts(bulk_data: ContactBulkRequest, db: Session = Depends(get_db)):
    """Batch endpoint for crawler to submit multiple contacts from pages visited."""
    inserted = 0
    updated = 0
    skipped_invalid = 0
    results: List[Contact] = []
    
    for item in bulk_data.contacts:
        normalized = normalize_email(item.email)
        if not normalized:
            skipped_invalid += 1
            continue
            
        is_valid = is_valid_email_syntax(normalized)
        computed_status = item.verification_status or ("unverified" if is_valid else "invalid")
        computed_type = item.email_type or classify_email_type(normalized)
        
        domain = item.source_domain
        if not domain and item.source_url:
            domain = extract_domain(item.source_url)
            
        existing = db.query(Contact).filter(Contact.email_normalized == normalized).first()
        if existing:
            # Update fields if currently empty
            if item.company_name and not existing.company_name:
                existing.company_name = item.company_name.strip()
            if item.contact_name and not existing.contact_name:
                existing.contact_name = item.contact_name.strip()
            if item.job_title and not existing.job_title:
                existing.job_title = item.job_title.strip()
            if item.source_url and not existing.source_url:
                existing.source_url = item.source_url.strip()
            if domain and not existing.source_domain:
                existing.source_domain = domain
                
            existing.updated_at = datetime.utcnow()
            results.append(existing)
            updated += 1
        else:
            new_contact = Contact(
                company_name=item.company_name.strip() if item.company_name else None,
                contact_name=item.contact_name.strip() if item.contact_name else None,
                job_title=item.job_title.strip() if item.job_title else None,
                email=item.email.strip(),
                email_normalized=normalized,
                source_url=item.source_url.strip() if item.source_url else None,
                source_domain=domain,
                verification_status=computed_status,
                email_type=computed_type,
                reviewed=item.reviewed or False,
                notes=item.notes.strip() if item.notes else None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_contact)
            results.append(new_contact)
            inserted += 1
            
    db.commit()
    for c in results:
        db.refresh(c)
        
    return {
        "total_received": len(bulk_data.contacts),
        "inserted": inserted,
        "updated": updated,
        "skipped_invalid": skipped_invalid,
        "contacts": results
    }


@app.get("/api/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    """Retrieve single contact by ID."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@app.patch("/api/contacts/{contact_id}", response_model=ContactResponse)
@app.put("/api/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: int, updates: ContactUpdate, db: Session = Depends(get_db)):
    """Update contact attributes (verification status, reviewed flag, notes, etc.)."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    update_data = updates.model_dump(exclude_unset=True)
    
    if "email" in update_data and update_data["email"]:
        new_norm = normalize_email(update_data["email"])
        # Check collision with other contact
        existing = db.query(Contact).filter(
            Contact.email_normalized == new_norm,
            Contact.id != contact_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another contact with this email already exists.")
        contact.email = update_data["email"].strip()
        contact.email_normalized = new_norm
        
    if "verification_status" in update_data:
        contact.verification_status = update_data["verification_status"]
    if "email_type" in update_data:
        contact.email_type = update_data["email_type"]
    if "reviewed" in update_data:
        contact.reviewed = update_data["reviewed"]
    if "notes" in update_data:
        contact.notes = update_data["notes"]
    if "company_name" in update_data:
        contact.company_name = update_data["company_name"]
    if "contact_name" in update_data:
        contact.contact_name = update_data["contact_name"]
    if "job_title" in update_data:
        contact.job_title = update_data["job_title"]
    if "source_url" in update_data:
        contact.source_url = update_data["source_url"]
        if not contact.source_domain and contact.source_url:
            contact.source_domain = extract_domain(contact.source_url)
            
    contact.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contact)
    return contact


@app.delete("/api/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Delete a contact record."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/export.csv")
def export_contacts_csv(
    q: Optional[str] = None,
    verification_status: Optional[str] = None,
    email_type: Optional[str] = None,
    reviewed: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Exports all or filtered contacts as a downloadable CSV file.
    Matching the exact URL: http://127.0.0.1:8000/api/export.csv
    """
    query = db.query(Contact)
    
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Contact.company_name.ilike(search_pattern),
                Contact.contact_name.ilike(search_pattern),
                Contact.job_title.ilike(search_pattern),
                Contact.email.ilike(search_pattern),
                Contact.source_domain.ilike(search_pattern),
                Contact.notes.ilike(search_pattern)
            )
        )
    if verification_status and verification_status != "all":
        query = query.filter(Contact.verification_status == verification_status)
    if email_type and email_type != "all":
        query = query.filter(Contact.email_type == email_type)
    if reviewed is not None:
        query = query.filter(Contact.reviewed == reviewed)
        
    contacts = query.order_by(desc(Contact.created_at)).all()
    
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    # Header row
    writer.writerow([
        "id",
        "company_name",
        "contact_name",
        "job_title",
        "email",
        "email_normalized",
        "email_type",
        "verification_status",
        "reviewed",
        "notes",
        "source_domain",
        "source_url",
        "created_at",
        "updated_at"
    ])
    
    for c in contacts:
        writer.writerow([
            c.id,
            c.company_name or "",
            c.contact_name or "",
            c.job_title or "",
            c.email or "",
            c.email_normalized or "",
            c.email_type or "",
            c.verification_status or "",
            "yes" if c.reviewed else "no",
            (c.notes or "").replace("\n", " "),
            c.source_domain or "",
            c.source_url or "",
            c.created_at.isoformat() if c.created_at else "",
            c.updated_at.isoformat() if c.updated_at else ""
        ])
        
    csv_content = output.getvalue()
    # Add UTF-8 BOM so Excel opens it with German umlauts properly
    bom_csv = "\ufeff" + csv_content
    
    filename = f"hr_contacts_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=bom_csv.encode("utf-8"),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
