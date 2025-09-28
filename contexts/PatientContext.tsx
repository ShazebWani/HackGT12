import React, { createContext, useContext, useReducer, useMemo, useEffect, useCallback } from 'react';
import { Patient, PatientState, PatientAction } from '../lib/types';
import { PatientService } from '../lib/patientService';

// Initial state
const initialState: PatientState = {
  patients: [],
  activePatientId: null,
  searchQuery: '',
  pendingNewPatient: null,
};

// Patient reducer
function patientReducer(state: PatientState, action: PatientAction): PatientState {
  switch (action.type) {
    case 'SELECT_PATIENT':
      return {
        ...state,
        activePatientId: action.payload || null, // Allow deselection with empty string
        pendingNewPatient: null, // Clear pending when selecting existing patient
      };

    case 'UPSERT_PATIENT': {
      const patient = action.payload;
      const existingIndex = state.patients.findIndex(p => p.id === patient.id);
      
      let updatedPatients;
      if (existingIndex >= 0) {
        // Update existing patient
        updatedPatients = [...state.patients];
        updatedPatients[existingIndex] = patient;
      } else {
        // Add new patient
        updatedPatients = [patient, ...state.patients];
      }

      return {
        ...state,
        patients: updatedPatients,
        activePatientId: patient.id,
        pendingNewPatient: null,
      };
    }

    case 'LOAD_PATIENT': {
      const patient = action.payload;
      const existingIndex = state.patients.findIndex(p => p.id === patient.id);
      
      let updatedPatients;
      if (existingIndex >= 0) {
        // Update existing patient
        updatedPatients = [...state.patients];
        updatedPatients[existingIndex] = patient;
      } else {
        // Add new patient
        updatedPatients = [patient, ...state.patients];
      }

      return {
        ...state,
        patients: updatedPatients,
        // Don't set activePatientId when loading patients
      };
    }

    case 'TOUCH_PATIENT': {
      const patientId = action.payload;
      const now = new Date().toISOString();
      
      const updatedPatients = state.patients.map(patient =>
        patient.id === patientId
          ? { ...patient, lastUpdated: now }
          : patient
      );

      return {
        ...state,
        patients: updatedPatients,
      };
    }

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_PENDING_NEW_PATIENT':
      return {
        ...state,
        pendingNewPatient: action.payload,
      };

    default:
      return state;
  }
}

// Context type
interface PatientContextType {
  state: PatientState;
  dispatch: React.Dispatch<PatientAction>;
  // Derived selectors
  patientsSorted: Patient[];
  filteredPatients: Patient[];
  activePatient: Patient | null;
  // Actions
  selectPatient: (id: string) => void;
  upsertPatient: (patient: Patient) => void;
  touchPatient: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setPendingNewPatient: (patient: Partial<Patient> | null) => void;
}

// Create context
const PatientContext = createContext<PatientContextType | undefined>(undefined);

// Custom hook to use the context
export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}

// Helper function to load patients from API
async function loadPatientsFromAPI(): Promise<Patient[]> {
  try {
    console.log('Loading patients from API...');
    const patients = await PatientService.getAllPatients();
    console.log('Loaded patients from API:', patients);
    return patients;
  } catch (error) {
    console.error('Failed to load patients from API:', error);
    return [];
  }
}

// Provider component
export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(patientReducer, initialState);

  // Initialize patients from API
  useEffect(() => {
    const loadPatients = async () => {
      const patients = await loadPatientsFromAPI();
      patients.forEach(patient => {
        dispatch({ type: 'LOAD_PATIENT', payload: patient });
      });
    };
    loadPatients();
  }, []);

  // Derived selectors using useMemo for performance
  const patientsSorted = useMemo(() => {
    return [...state.patients].sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [state.patients]);

  const filteredPatients = useMemo(() => {
    if (!state.searchQuery.trim()) {
      return patientsSorted;
    }

    const query = state.searchQuery.toLowerCase().trim();
    return patientsSorted.filter(patient => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const mrn = patient.mrn.toLowerCase();
      const dob = patient.dateOfBirth;

      return (
        fullName.includes(query) ||
        mrn.includes(query) ||
        dob === query
      );
    });
  }, [patientsSorted, state.searchQuery]);

  const activePatient = useMemo(() => {
    return state.activePatientId 
      ? state.patients.find(p => p.id === state.activePatientId) || null
      : null;
  }, [state.patients, state.activePatientId]);

  // Action creators - memoized to prevent infinite re-renders
  const selectPatient = useCallback((id: string) => {
    dispatch({ type: 'SELECT_PATIENT', payload: id });
  }, []);

  const upsertPatient = useCallback(async (patient: Patient) => {
    try {
      let savedPatient: Patient;
      
      if (patient.id && state.patients.find(p => p.id === patient.id)) {
        // Update existing patient
        savedPatient = await PatientService.updatePatient(patient.id, patient);
      } else {
        // Create new patient
        savedPatient = await PatientService.createPatient(patient);
      }
      
      dispatch({ type: 'UPSERT_PATIENT', payload: savedPatient });
    } catch (error) {
      console.error('Error saving patient:', error);
      // You might want to show an error message to the user here
      throw error;
    }
  }, [state.patients]);

  const touchPatient = useCallback((id: string) => {
    dispatch({ type: 'TOUCH_PATIENT', payload: id });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setPendingNewPatient = useCallback((patient: Partial<Patient> | null) => {
    dispatch({ type: 'SET_PENDING_NEW_PATIENT', payload: patient });
  }, []);

  const contextValue: PatientContextType = useMemo(() => ({
    state,
    dispatch,
    patientsSorted,
    filteredPatients,
    activePatient,
    selectPatient,
    upsertPatient,
    touchPatient,
    setSearchQuery,
    setPendingNewPatient,
  }), [
    state,
    dispatch,
    patientsSorted,
    filteredPatients,
    activePatient,
    selectPatient,
    upsertPatient,
    touchPatient,
    setSearchQuery,
    setPendingNewPatient,
  ]);

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
}
