import { Patient } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PatientCreateRequest {
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}

export interface PatientUpdateRequest {
  mrn?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  medical_data?: any;
}

export interface PatientResponse {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  last_updated: string;
  medical_data?: any;
}

// Convert API response to frontend Patient type
function convertToPatient(apiPatient: PatientResponse): Patient {
  return {
    id: apiPatient.id,
    mrn: apiPatient.mrn,
    firstName: apiPatient.first_name,
    lastName: apiPatient.last_name,
    dateOfBirth: apiPatient.date_of_birth,
    lastUpdated: apiPatient.last_updated,
    medicalData: apiPatient.medical_data
  };
}

// Convert frontend Patient type to API request
function convertToApiRequest(patient: Partial<Patient>): PatientCreateRequest {
  return {
    mrn: patient.mrn!,
    first_name: patient.firstName!,
    last_name: patient.lastName!,
    date_of_birth: patient.dateOfBirth!
  };
}

export class PatientService {
  static async getAllPatients(): Promise<Patient[]> {
    try {
      console.log('Fetching patients from:', `${API_BASE_URL}/api/patients`);
      const response = await fetch(`${API_BASE_URL}/api/patients`);
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.statusText}`);
      }
      const apiPatients: PatientResponse[] = await response.json();
      console.log('API response:', apiPatients);
      return apiPatients.map(convertToPatient);
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  static async getPatientById(id: string): Promise<Patient> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch patient: ${response.statusText}`);
      }
      const apiPatient: PatientResponse = await response.json();
      return convertToPatient(apiPatient);
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  static async createPatient(patient: Partial<Patient>): Promise<Patient> {
    try {
      const requestData = convertToApiRequest(patient);
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create patient: ${response.statusText}`);
      }
      
      const apiPatient: PatientResponse = await response.json();
      return convertToPatient(apiPatient);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  static async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    try {
      const requestData: PatientUpdateRequest = {};
      if (updates.mrn !== undefined) requestData.mrn = updates.mrn;
      if (updates.firstName !== undefined) requestData.first_name = updates.firstName;
      if (updates.lastName !== undefined) requestData.last_name = updates.lastName;
      if (updates.dateOfBirth !== undefined) requestData.date_of_birth = updates.dateOfBirth;
      if (updates.medicalData !== undefined) requestData.medical_data = updates.medicalData;

      const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update patient: ${response.statusText}`);
      }
      
      const apiPatient: PatientResponse = await response.json();
      return convertToPatient(apiPatient);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  static async deletePatient(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete patient: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }
}
