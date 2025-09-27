export interface BillingCode {
  code: string;
  description: string;
  units?: number;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface ScribeAgentResponse {
  patientName: string;
  dateOfService: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExam: string;
  assessment: string;
  plan: string;
  prescriptions: Prescription[];
  billingCodes: BillingCode[];
  followUpInstructions: string;
}

// Patient Dashboard Types
export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  lastUpdated: string; // ISO timestamp
  // Embed the existing ScribeAgentResponse data
  medicalData?: ScribeAgentResponse;
}

export interface PatientState {
  patients: Patient[];
  activePatientId: string | null;
  searchQuery: string;
  pendingNewPatient: Partial<Patient> | null;
}

export type PatientAction =
  | { type: 'SELECT_PATIENT'; payload: string }
  | { type: 'UPSERT_PATIENT'; payload: Patient }
  | { type: 'TOUCH_PATIENT'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_PENDING_NEW_PATIENT'; payload: Partial<Patient> | null }
