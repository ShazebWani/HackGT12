#!/usr/bin/env python3
"""
Test fixtures containing sample medical transcripts for testing purposes.
This file contains hard-coded test data that should only be used in test environments.
"""

# Sample medical transcript for testing SOAP agent
SAMPLE_HYPERTENSION_TRANSCRIPT = """
Patient is a 45-year-old male here for a follow-up on his hypertension. 
He says he's been taking his lisinopril daily and has been checking his blood pressure, 
which is running about 130 over 80. No complaints of dizziness or side effects. 
Exam shows a BP of 128/82 and a heart rate of 70. Lungs are clear. 
We'll continue the current dose of lisinopril 10mg and see him back in 3 months.
"""

# Sample medical transcript for testing UTI case
SAMPLE_UTI_TRANSCRIPT = """
Patient is a 32-year-old female presenting with dysuria and frequency for 3 days.
She reports burning with urination and increased frequency. No fever or back pain.
Urinalysis shows positive nitrites and leukocyte esterase. 
Prescribing nitrofurantoin 100mg twice daily for 5 days.
Follow up if symptoms persist.
"""

# Sample medical transcript for testing chest pain case
SAMPLE_CHEST_PAIN_TRANSCRIPT = """
Patient is a 55-year-old male with acute onset chest pain and shortness of breath.
Pain started 2 hours ago, described as pressure-like, radiating to left arm.
Vital signs: BP 150/95, HR 110, RR 22. EKG shows ST elevation in leads II, III, aVF.
Ordering cardiac enzymes, chest X-ray, and aspirin 325mg.
"""

# Sample medical transcript for testing diabetes follow-up
SAMPLE_DIABETES_TRANSCRIPT = """
Patient is a 60-year-old female with type 2 diabetes for 10 years.
HbA1c is 8.2%, up from 7.5% 3 months ago. Blood glucose logs show poor control.
Continuing metformin 1000mg twice daily and adding glipizide 5mg daily.
Ordering ophthalmology referral and podiatry evaluation.
"""

# Sample medical transcript for testing routine physical
SAMPLE_PHYSICAL_TRANSCRIPT = """
Patient is a 35-year-old healthy female presenting for annual physical examination.
No acute complaints. Blood pressure 118/72, heart rate 68, temperature 98.6°F.
Physical exam unremarkable. Labs ordered: CBC, CMP, lipid panel.
Return in 1 year for next annual physical.
"""

# Dictionary of all sample transcripts for easy access
SAMPLE_TRANSCRIPTS = {
    "hypertension": SAMPLE_HYPERTENSION_TRANSCRIPT,
    "uti": SAMPLE_UTI_TRANSCRIPT,
    "chest_pain": SAMPLE_CHEST_PAIN_TRANSCRIPT,
    "diabetes": SAMPLE_DIABETES_TRANSCRIPT,
    "physical": SAMPLE_PHYSICAL_TRANSCRIPT,
}

def get_sample_transcript(case_type: str) -> str:
    """Get a sample transcript by case type."""
    return SAMPLE_TRANSCRIPTS.get(case_type, SAMPLE_HYPERTENSION_TRANSCRIPT)

def get_all_sample_transcripts() -> dict:
    """Get all sample transcripts."""
    return SAMPLE_TRANSCRIPTS.copy()
