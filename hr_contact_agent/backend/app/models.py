from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Inferred company name from visible page labels or metadata
    company_name = Column(String(255), nullable=True, index=True)
    
    # Explicit contact name from recognizable contact label (e.g., Ansprechpartner)
    contact_name = Column(String(255), nullable=True)
    
    # Job posting title or page title
    job_title = Column(String(255), nullable=True)
    
    # Original published email as extracted
    email = Column(String(255), nullable=False)
    
    # Normalized lowercase email used as deduplication key
    email_normalized = Column(String(255), nullable=False, unique=True, index=True)
    
    # Source page URL and extracted website domain
    source_url = Column(Text, nullable=True)
    source_domain = Column(String(255), nullable=True, index=True)
    
    # Status: unverified, verified, not_found, or invalid
    verification_status = Column(String(50), default="unverified", nullable=False, index=True)
    
    # Classification: generic inbox vs person_or_other
    email_type = Column(String(50), default="person_or_other", nullable=False, index=True)
    
    # Human review flag and notes
    reviewed = Column(Boolean, default=False, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Contact(id={self.id}, email='{self.email_normalized}', company='{self.company_name}')>"
