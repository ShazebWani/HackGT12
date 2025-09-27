import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { Patient, PatientState, PatientAction } from '../lib/types';
import { mockPatients } from '../lib/mock-data';

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
        activePatientId: action.payload,
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

// Helper function to load patients from localStorage
function loadPatientsFromStorage(): Patient[] {
  if (typeof window === 'undefined') return mockPatients;
  
  try {
    const stored = localStorage.getItem('patients');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array and has proper structure
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load patients from localStorage:', error);
  }
  
  return mockPatients;
}

// Helper function to save patients to localStorage
function savePatientsToStorage(patients: Patient[]) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('patients', JSON.stringify(patients));
  } catch (error) {
    console.warn('Failed to save patients to localStorage:', error);
  }
}

// Provider component
export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(patientReducer, initialState);

  // Initialize patients from localStorage or mock data
  useEffect(() => {
    const patients = loadPatientsFromStorage();
    patients.forEach(patient => {
      dispatch({ type: 'UPSERT_PATIENT', payload: patient });
    });
  }, []);

  // Save to localStorage whenever patients change
  useEffect(() => {
    if (state.patients.length > 0) {
      savePatientsToStorage(state.patients);
    }
  }, [state.patients]);

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

  // Action creators
  const selectPatient = (id: string) => {
    dispatch({ type: 'SELECT_PATIENT', payload: id });
  };

  const upsertPatient = (patient: Patient) => {
    dispatch({ type: 'UPSERT_PATIENT', payload: patient });
  };

  const touchPatient = (id: string) => {
    dispatch({ type: 'TOUCH_PATIENT', payload: id });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const setPendingNewPatient = (patient: Partial<Patient> | null) => {
    dispatch({ type: 'SET_PENDING_NEW_PATIENT', payload: patient });
  };

  const contextValue: PatientContextType = {
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
  };

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
}
