import re
from urllib.parse import urlparse
from typing import Optional

# Regular expression for email validation
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)

# Common generic inbox prefixes (German & English)
GENERIC_PREFIXES = {
    "info",
    "kontakt",
    "contact",
    "contacts",
    "jobs",
    "job",
    "karriere",
    "career",
    "careers",
    "bewerbung",
    "bewerbungen",
    "recruiting",
    "recruitment",
    "hr",
    "humanresources",
    "human-resources",
    "personal",
    "personalabteilung",
    "team",
    "support",
    "office",
    "mail",
    "hello",
    "hallo",
    "service",
    "work",
    "arbeit",
    "presse",
    "press",
    "admin",
    "post",
    "poststelle",
    "anfragen",
    "inquiry",
    "talent",
    "talents",
    "join",
    "apply",
    "hiring",
    "general",
    "help",
    "feedback"
}

# Image / asset extensions that are false positive matches for emails (e.g. icon@2x.png)
INVALID_TLDS = {
    "png", "jpg", "jpeg", "gif", "webp", "svg", "css", "js", "html", "htm", "php", "ico", "woff", "woff2", "pdf"
}

# Placeholder domains to filter out
PLACEHOLDER_DOMAINS = {
    "example.com", "domain.com", "placeholder.com", "test.com", "sample.com", "yourdomain.com", "email.com"
}


def normalize_email(email: Optional[str]) -> str:
    """
    Normalizes an email address:
    - Strips whitespace
    - Removes 'mailto:' prefix
    - Lowercases
    - Strips any enclosing quotes/brackets
    - Trims common trailing punctuation
    """
    if not email:
        return ""
    
    cleaned = email.strip()
    # Remove mailto:
    if cleaned.lower().startswith("mailto:"):
        cleaned = cleaned[7:]
    
    # Remove URL params (e.g. ?subject=...)
    if "?" in cleaned:
        cleaned = cleaned.split("?")[0]
        
    cleaned = cleaned.strip().strip("<>\"'()[]{}").lower()
    # Remove trailing punctuation (commas, dots, semicolons)
    cleaned = re.sub(r"[.,;:!]+$", "", cleaned)
    return cleaned


def is_valid_email_syntax(email: Optional[str]) -> bool:
    """
    Validates if an email address satisfies standard RFC syntax
    and is not an asset or placeholder string.
    """
    if not email:
        return False
    
    normalized = normalize_email(email)
    if not EMAIL_REGEX.match(normalized):
        return False
    
    try:
        local_part, domain_part = normalized.split("@", 1)
    except ValueError:
        return False

    # Check TLD
    domain_parts = domain_part.split(".")
    if len(domain_parts) < 2:
        return False
    
    tld = domain_parts[-1].lower()
    if len(tld) < 2 or tld in INVALID_TLDS:
        return False
        
    if domain_part in PLACEHOLDER_DOMAINS:
        return False

    return True


def classify_email_type(email: Optional[str]) -> str:
    """
    Classifies an email as 'generic' or 'person_or_other'.
    Checks the local part against common corporate/HR contact mailboxes.
    """
    if not email:
        return "person_or_other"
    
    normalized = normalize_email(email)
    if "@" not in normalized:
        return "person_or_other"
        
    local_part = normalized.split("@")[0].lower()
    # Clean non-alphanumeric separators to check base word (e.g. hr.de, job-portal, jobs_berlin)
    clean_prefix = re.split(r"[._\-+0-9]", local_part)[0]
    
    if local_part in GENERIC_PREFIXES or clean_prefix in GENERIC_PREFIXES:
        return "generic"
    
    # Check compound patterns like bewerbung-tech, karriere.germany
    for prefix in GENERIC_PREFIXES:
        if local_part.startswith(f"{prefix}.") or local_part.startswith(f"{prefix}-") or local_part.startswith(f"{prefix}_"):
            return "generic"
            
    return "person_or_other"


def extract_domain(url: Optional[str]) -> str:
    """
    Extracts the cleaned root domain / hostname from a URL.
    Example: 'https://de.stepstone.de/stellenangebote/123' -> 'de.stepstone.de'
    """
    if not url:
        return ""
    
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "http://" + url
        
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        # Remove port if present
        if ":" in netloc:
            netloc = netloc.split(":")[0]
        # Remove www. prefix if present
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""
