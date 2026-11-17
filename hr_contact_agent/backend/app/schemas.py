from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class ContactBase(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    job_title: Optional[str] = None
    email: str
    source_url: Optional[str] = None
    source_domain: Optional[str] = None
    verification_status: Optional[str] = "unverified"
    email_type: Optional[str] = None
    reviewed: Optional[bool] = False
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    job_title: Optional[str] = None
    email: Optional[str] = None
    source_url: Optional[str] = None
    source_domain: Optional[str] = None
    verification_status: Optional[str] = None
    email_type: Optional[str] = None
    reviewed: Optional[bool] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: int
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    job_title: Optional[str] = None
    email: str
    email_normalized: str
    source_url: Optional[str] = None
    source_domain: Optional[str] = None
    verification_status: str
    email_type: str
    reviewed: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContactBulkRequest(BaseModel):
    contacts: List[ContactCreate]


class ContactBulkResponse(BaseModel):
    total_received: int
    inserted: int
    updated: int
    skipped_invalid: int
    contacts: List[ContactResponse]


class StatsResponse(BaseModel):
    total: int
    verified: int
    unverified: int
    invalid: int
    not_found: int
    generic: int
    person_or_other: int
    reviewed: int
    needs_review: int


class HealthResponse(BaseModel):
    status: str
    service: str
