"""
Shared AI Safety Constants and Verification Rules (Addendum 3 Fix 7).
Ensures all AI generation endpoints (Explanation Agent & Family Assistant) share identical clinical safety guardrails.
"""

BANNED_SUBSTRINGS = [
    "has rhd",
    "diagnosed with",
    "confirmed rhd",
    "patient has",
    "is suffering from",
    "positive for rheumatic",
    "definitely has",
    "cured of",
    "healed completely"
]

MANDATORY_DISCLAIMER = "This is a triage priority signal, not a diagnosis. Echocardiography is required for confirmation."

FAMILY_ASSISTANT_DISCLAIMER = "Please discuss these screening details with your doctor or healthcare worker at your next appointment."

def check_ai_safety(text: str) -> bool:
    """
    Returns True if text passes safety checks:
    1. Contains NO banned diagnostic phrases (case-insensitive)
    2. Contains a mandatory clinician referral closing statement
    """
    text_lower = text.lower()
    for banned in BANNED_SUBSTRINGS:
        if banned in text_lower:
            return False
    return (MANDATORY_DISCLAIMER.lower() in text_lower) or (FAMILY_ASSISTANT_DISCLAIMER.lower() in text_lower)
