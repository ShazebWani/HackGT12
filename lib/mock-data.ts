import { ScribeAgentResponse, Patient } from './types';

export const mockApiResponse: ScribeAgentResponse = {
  patientName: "Sarah Johnson",
  dateOfService: "2024-03-15",
  chiefComplaint: "Sore throat and fever for 3 days",
  historyOfPresentIllness: "Patient presents with a 3-day history of sore throat, fever up to 101.5°F, difficulty swallowing, and mild headache. No cough, runny nose, or ear pain. Patient reports decreased appetite and fatigue. No recent sick contacts or travel. Symptoms began gradually and have progressively worsened.",
  physicalExam: "Vital Signs: Temperature 100.8°F, BP 118/72, HR 88, RR 16, O2 Sat 98% on room air. General: Alert, oriented, appears mildly ill but not in acute distress. HEENT: Throat erythematous with tonsillar exudate bilaterally, no lymphadenopathy. Lungs: Clear to auscultation bilaterally. Heart: Regular rate and rhythm, no murmurs. Abdomen: Soft, non-tender, no organomegaly.",
  assessment: "Acute bacterial pharyngitis, likely streptococcal. Clinical presentation consistent with strep throat given tonsillar exudate, fever, and absence of cough or rhinorrhea.",
  plan: "Prescribe antibiotics for bacterial pharyngitis. Patient education on symptom management and when to return. Recommend rest, increased fluid intake, and throat lozenges for comfort. Follow-up if symptoms worsen or do not improve within 48-72 hours of starting antibiotics.",
  prescriptions: [
    {
      medication: "Amoxicillin",
      dosage: "500mg",
      frequency: "Three times daily",
      duration: "10 days",
      instructions: "Take with food to reduce stomach upset. Complete entire course even if feeling better."
    },
    {
      medication: "Ibuprofen",
      dosage: "400mg",
      frequency: "Every 6 hours as needed",
      duration: "5 days",
      instructions: "Take with food for pain and fever. Do not exceed 1200mg in 24 hours."
    }
  ],
  billingCodes: [
    {
      code: "99213",
      description: "Office visit, established patient, low to moderate complexity"
    },
    {
      code: "87081",
      description: "Culture, presumptive, pathogenic organisms, screening only"
    }
  ],
  followUpInstructions: "Return to clinic if symptoms worsen or do not improve within 72 hours of starting antibiotics. Seek immediate care if difficulty breathing, severe difficulty swallowing, or high fever persists. Complete the full course of antibiotics as prescribed."
};

// Mock patients data with dashboard-specific fields
export const mockPatients: Patient[] = [
  {
    id: "patient-001",
    mrn: "MRN-12345",
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: "1985-06-15",
    lastUpdated: "2024-03-15T14:30:00Z",
    medicalData: mockApiResponse
  },
  {
    id: "patient-002", 
    mrn: "MRN-67890",
    firstName: "Michael",
    lastName: "Chen",
    dateOfBirth: "1978-11-22",
    lastUpdated: "2024-03-14T09:15:00Z",
    medicalData: {
      patientName: "Michael Chen",
      dateOfService: "2024-03-14",
      chiefComplaint: "Annual physical examination",
      historyOfPresentIllness: "45-year-old male presents for routine annual physical. No acute complaints. Reports feeling well overall with good energy levels. No new symptoms since last visit.",
      physicalExam: "Vital Signs: Temperature 98.6°F, BP 128/78, HR 72, RR 14, O2 Sat 99% on room air. General: Well-appearing, no acute distress. Cardiovascular: Regular rate and rhythm, no murmurs. Respiratory: Clear to auscultation. Abdomen: Soft, non-tender.",
      assessment: "Healthy adult male, routine physical examination. Mild hypertension, well-controlled.",
      plan: "Continue current antihypertensive medication. Routine lab work ordered. Recommend continued diet and exercise modifications. Return in 1 year for annual physical or sooner if concerns arise.",
      prescriptions: [],
      billingCodes: [
        {
          code: "99395",
          description: "Periodic comprehensive preventive medicine evaluation, established patient, 40-64 years"
        }
      ],
      followUpInstructions: "Return in 1 year for annual physical. Contact office if any health concerns arise before next visit."
    }
  },
  {
    id: "patient-003",
    mrn: "MRN-11111",
    firstName: "Emma",
    lastName: "Rodriguez", 
    dateOfBirth: "1992-03-08",
    lastUpdated: "2024-03-13T16:45:00Z",
    medicalData: {
      patientName: "Emma Rodriguez",
      dateOfService: "2024-03-13",
      chiefComplaint: "Knee pain after running",
      historyOfPresentIllness: "32-year-old female runner presents with right knee pain that started 3 days ago after a long run. Pain is localized to the medial aspect of the knee, worse with activity and improved with rest. No swelling or locking sensation.",
      physicalExam: "Vital Signs: Temperature 98.4°F, BP 118/70, HR 68, RR 16. Right knee: Mild tenderness over medial joint line, full range of motion, no effusion, negative McMurray test. No instability noted.",
      assessment: "Right knee medial meniscus strain, likely from overuse. No evidence of significant tear.",
      plan: "Conservative management with rest, ice, compression, elevation. NSAIDs for pain relief. Physical therapy referral. Gradual return to running activities.",
      prescriptions: [
        {
          medication: "Naproxen",
          dosage: "220mg",
          frequency: "Twice daily with food",
          duration: "7 days",
          instructions: "Take with food to prevent stomach upset. Stop if stomach pain develops."
        }
      ],
      billingCodes: [
        {
          code: "99214",
          description: "Office visit, established patient, moderate complexity"
        }
      ],
      followUpInstructions: "Return in 2 weeks if pain persists or worsens. Begin physical therapy within 1 week. Avoid running until pain-free."
    }
  }
];
