from safety_constants import BANNED_SUBSTRINGS, FAMILY_ASSISTANT_DISCLAIMER

class AIFamilyAssistant:
    """
    Constrained conversational agent for parent/guardian questions ('Ask CardioSentinel').
    Strict Safety Constraint: Never diagnoses, never promises cures, grounds answers only in recorded screening data,
    and always appends FAMILY_ASSISTANT_DISCLAIMER.
    """
    def __init__(self):
        pass

    def answer_question(self, question: str, child_context: dict, language: str = "en") -> str:
        q_lower = question.lower()
        child_code = child_context.get("anonymized_code", "Your child")
        risk_tier = child_context.get("risk_tier", "moderate")
        has_referral = child_context.get("has_referral", False)
        
        # Determine core response message based on query intent & risk tier
        if "theek" in q_lower or "okay" in q_lower or "recover" in q_lower or "will my child" in q_lower or "darr" in q_lower or "fear" in q_lower:
            if language == "hi":
                body = f"{child_code} का स्कूल कैंप में कार्डियोसेंटिनल स्क्रीनिंग पूरा हुआ है। स्क्रीनिंग परिणाम {risk_tier.upper()} प्राथमिकता दिखाता है। घबराने की आवश्यकता नहीं है, लेकिन समय पर डॉक्टर की सलाह लेना बहुत महत्वपूर्ण है।"
            elif language == "kh":
                body = f"Ka jingscreen ia i khun phra {child_code} mynta ka sngi ka pyni ia ka priority category {risk_tier.upper()}. Wat sngew triem, hynrei leit kynduh ia u doctor ha hospital."
            else:
                body = f"{child_code} completed screening at the school camp with a {risk_tier.upper()} priority category. There is no need to panic, but following up for a medical checkup is important for peace of mind."
        elif "echo" in q_lower or "hospital" in q_lower or "where" in q_lower or "kahan" in q_lower:
            if language == "hi":
                body = f"आपके बच्चे {child_code} के लिए इकोकार्डियोग्राम सलाह दी गई है। निकटतम सुविधाएं आपके गार्जियन पोर्टल के 'Nearest Facilities' टैब में सूचीबद्ध हैं।"
            else:
                body = f"An echocardiogram checkup is recommended for {child_code}. You can find the nearest equipped hospital facilities listed with wait times under the 'Nearest Facilities' tab."
        else:
            if language == "hi":
                body = f"{child_code} के स्वास्थ्य अपडेट के बारे में: स्क्रीनिंग टीम ने रिकॉर्ड किया है कि प्राथमिकता श्रेणी {risk_tier.upper()} है।"
            else:
                body = f"Regarding {child_code}'s screening record: The camp team recorded a {risk_tier.upper()} triage priority category based on heart sound audio and health factors."

        if has_referral:
            if language == "hi":
                body += " एक रेफरल पर्ची जारी की गई है जिसे आप अस्पताल में दिखा सकते हैं।"
            else:
                body += " A referral slip has been issued for your upcoming hospital visit."

        # Safety Check: Sanitize any inadvertent banned substring
        for banned in BANNED_SUBSTRINGS:
            if banned in body.lower():
                body = body.lower().replace(banned, "has a screening priority indicator")

        # Always append mandatory clinician referral line
        return f"{body} {FAMILY_ASSISTANT_DISCLAIMER}".strip()
