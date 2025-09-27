export interface Prescription {
  medication: string
  dosage: string
  frequency: string
  duration: string
}

export interface BillingCode {
  code: string
  description: string
}

export interface ScribeResult {
  transcription: string
  soap_note: string
  diagnosis: string
  billing_code: BillingCode
  prescriptions: Prescription[]
  lab_orders: string[]
  // optional UI helpers
  partial_transcript?: string
  isFinal?: boolean
}

export default ScribeResult