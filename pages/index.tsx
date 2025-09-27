import { useState } from 'react'
import { Search, User } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PatientInfoCard from '../components/PatientInfoCard'
import AudioRecordingCard from '../components/AudioRecordingCard'
import TextFileUploadCard from '../components/TextFileUploadCard'
import ResultsDisplay from '../components/ResultsDisplay'
import { usePatient } from '../contexts/PatientContext'

export default function Home() {
  const [patientName, setPatientName] = useState('')
  const [patientDob, setPatientDob] = useState('')
  const [results, setResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Audio recorder state
  const [audioStatus, setAudioStatus] = useState<'idle' | 'recording'>('idle')
  
  // Patient context
  const { setSearchQuery, state, activePatient } = usePatient()

  const startRecording = () => {
    setAudioStatus('recording')
    setResults(null)
    setIsProcessing(false)
  }
  
  const stopRecording = () => {
    setAudioStatus('idle')
    setIsProcessing(true)
  }

  const handleRecordingResults = (recordingResults: any) => {
    setResults(recordingResults)
    setIsProcessing(false)
  }

  const handleTextFileUpload = (file: File) => {
    console.log('Text file uploaded:', file.name)
    // Here you could read the file content and process it
  }

  // Transform patient medical data for ResultsDisplay component format
  const getResultsFromPatient = (patient: any) => {
    if (!patient?.medicalData) return null;
    
    const medicalData = patient.medicalData;
    return {
      transcription: `Patient: ${medicalData.patientName}. Chief complaint: ${medicalData.chiefComplaint}. ${medicalData.historyOfPresentIllness}`,
      soap_note: `Subjective: ${medicalData.chiefComplaint}

${medicalData.historyOfPresentIllness}

Objective: ${medicalData.physicalExam}

Assessment: ${medicalData.assessment}

Plan: ${medicalData.plan}

Follow-up: ${medicalData.followUpInstructions}`,
      diagnosis: medicalData.assessment,
      billing_code: medicalData.billingCodes?.[0] || { code: '', description: '' },
      prescriptions: medicalData.prescriptions || [],
      lab_orders: [] // This could be extracted from plan if needed
    };
  };

  // Get results from active patient or current results
  const displayResults = results || getResultsFromPatient(activePatient);

  return (
    <div className="flex h-screen min-h-screen bg-base">
      <Sidebar />
      <div className='flex-1 overflow-auto p-6'>
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name, MRN, or date of birth..."
                value={state.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors bg-white"
              />
            </div>
          </div>

          {/* Patient Info */}
          <PatientInfoCard 
            patientName={patientName}
            setPatientName={setPatientName}
            patientDob={patientDob}
            setPatientDob={setPatientDob}
          />
          
          {/* Input Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AudioRecordingCard 
              audioStatus={audioStatus}
              startRecording={startRecording}
              stopRecording={stopRecording}
              handleRecordingResults={handleRecordingResults}
            />
            
            <TextFileUploadCard 
              onFileUpload={handleTextFileUpload}
            />
          </div>
          
          {/* Results Area */}
          {displayResults && (
            <div className="medical-card">
              <ResultsDisplay results={displayResults} />
            </div>
          )}
          
          {!displayResults && !isProcessing && activePatient && (
            <div className="medical-card text-center py-12">
              <div className="text-gray-400 mb-4">
                <User className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Patient Selected: {activePatient.firstName} {activePatient.lastName}
              </h3>
              <p className="text-gray-500 mb-4">
                Record audio or upload text to generate medical documentation.
              </p>
              <div className="text-sm text-gray-400">
                MRN: {activePatient.mrn} • DOB: {activePatient.dateOfBirth}
              </div>
            </div>
          )}
          
          {!displayResults && !isProcessing && !activePatient && (
            <div className="medical-card text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Patient Selected
              </h3>
              <p className="text-gray-500">
                Select a patient from the sidebar or create a new patient to get started.
              </p>
            </div>
          )}
          
          {isProcessing && (
            <div className="medical-card text-center">
              <div className="animate-spin h-8 w-8 border-4 border-accent-1 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-accent-1">Processing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
