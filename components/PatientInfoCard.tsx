import { useState, useEffect } from 'react'
import { User, Search, Plus, X } from 'lucide-react'
import { usePatient } from '../contexts/PatientContext'
import { Patient } from '../lib/types'

interface PatientInfoProps {
  patientName?: string
  setPatientName?: (name: string) => void
  patientDob?: string
  setPatientDob?: (dob: string) => void
}

const PatientInfoCard = ({ patientName = '', setPatientName = () => {}, patientDob = '', setPatientDob = () => {} }: PatientInfoProps = {}) => {
  const { 
    state, 
    selectPatient, 
    upsertPatient, 
    touchPatient, 
    setPendingNewPatient,
    setSearchQuery 
  } = usePatient();

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mrn, setMrn] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)

  // Update search query as user types to filter sidebar
  useEffect(() => {
    const searchTerms = []
    
    if (firstName.trim()) searchTerms.push(firstName.trim())
    if (lastName.trim()) searchTerms.push(lastName.trim())
    if (mrn.trim()) searchTerms.push(mrn.trim())
    if (dateOfBirth) searchTerms.push(dateOfBirth)
    
    const query = searchTerms.join(' ')
    setSearchQuery(query)
  }, [firstName, lastName, mrn, dateOfBirth, setSearchQuery])

  // Clear search when component unmounts (when patient is selected)
  useEffect(() => {
    return () => {
      setSearchQuery('')
    }
  }, [setSearchQuery])

  // Generate a new MRN
  const generateMRN = () => {
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MRN-${timestamp}${random}`;
  };

  // Find patient by criteria
  const findPatient = (firstName: string, lastName: string, dob: string, mrn?: string) => {
    return state.patients.find(patient => {
      if (mrn && mrn.trim()) {
        return patient.mrn.toLowerCase() === mrn.toLowerCase().trim();
      }
      
      return (
        patient.firstName.toLowerCase() === firstName.toLowerCase().trim() &&
        patient.lastName.toLowerCase() === lastName.toLowerCase().trim() &&
        patient.dateOfBirth === dob
      );
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth || !mrn.trim()) {
      alert('Please fill in all required fields (First Name, Last Name, Date of Birth, MRN)');
      return;
    }

    // Try to find existing patient
    const existingPatient = findPatient(firstName, lastName, dateOfBirth, mrn);

    if (existingPatient) {
      // Patient found - select them and optionally bump recency
      selectPatient(existingPatient.id);
      touchPatient(existingPatient.id);
      
      // Clear form and search query
      clearForm();
    } else {
      // Patient not found - set up for creation
      setPendingNewPatient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        mrn: mrn.trim()
      });
      setShowNewPatientModal(true);
    }
  };

  // Handle new patient creation
  const handleCreatePatient = async () => {
    if (!state.pendingNewPatient) return;

    try {
      const newPatient: Patient = {
        id: `patient-${Date.now()}`,
        mrn: state.pendingNewPatient.mrn!,
        firstName: state.pendingNewPatient.firstName!,
        lastName: state.pendingNewPatient.lastName!,
        dateOfBirth: state.pendingNewPatient.dateOfBirth!,
        lastUpdated: new Date().toISOString(),
        // No medical data initially
      };

      await upsertPatient(newPatient);
      
      // Update legacy form fields
      setPatientName(`${newPatient.firstName} ${newPatient.lastName}`);
      setPatientDob(newPatient.dateOfBirth);
      
      // Close modal and clear forms
      setShowNewPatientModal(false);
      setPendingNewPatient(null);
      clearForm();
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Failed to create patient. Please try again.');
    }
  };

  // Clear form fields
  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setMrn('');
    setDateOfBirth('');
    setSearchQuery(''); // Clear sidebar filtering when form is cleared
  };

  // Cancel new patient creation
  const handleCancelCreate = () => {
    setShowNewPatientModal(false);
    setPendingNewPatient(null);
  };

  return (
    <>
      <div className="medical-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-accent-1" />
          <h2 className="text-lg font-semibold text-accent-1">Patient Information</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MRN *
              </label>
              <input
                type="text"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                placeholder="Enter MRN"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              Find or Create Patient
            </button>
            
            <button
              type="button"
              onClick={clearForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* New Patient Modal */}
      {showNewPatientModal && state.pendingNewPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Patient</h3>
              <button
                onClick={handleCancelCreate}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                No existing patient found with these details. Would you like to create a new patient record?
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <p><strong>Name:</strong> {state.pendingNewPatient.firstName} {state.pendingNewPatient.lastName}</p>
                <p><strong>DOB:</strong> {state.pendingNewPatient.dateOfBirth}</p>
                <p><strong>MRN:</strong> {state.pendingNewPatient.mrn}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCreatePatient}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Patient
              </button>
              
              <button
                onClick={handleCancelCreate}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PatientInfoCard