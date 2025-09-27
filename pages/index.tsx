import { useState, useEffect } from 'react'
import { Search, User } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PatientInfoCard from '../components/PatientInfoCard'
import PatientDisplayCard from '../components/PatientDisplayCard'
import AudioRecordingCard from '../components/AudioRecordingCard'
import TextFileUploadCard from '../components/TextFileUploadCard'
import ResultsCard from '@/components/ResultsCard'
import ProcessingIndicator from '@/components/ProcessingIndicator'
import { usePatient } from '../contexts/PatientContext'

export default function Home() {
  const [patientName, setPatientName] = useState('')
  const [patientDob, setPatientDob] = useState('')
  const [results, setResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAudio, setIsAudio] = useState(false)

  // Audio recorder state
  const [audioStatus, setAudioStatus] = useState<'idle' | 'recording'>('idle')
  
  // Patient context
  const { state, activePatient } = usePatient()

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
    console.log("Recording results:", recordingResults);

    if (!recordingResults) return;

    // Always set just the transcription string, not the whole object
    const text = recordingResults.transcription;

    setIsAudio(text);  // <-- store string, not object
    setIsProcessing(!recordingResults.isFinal); // still use isFinal for processing state
  };

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (results) {
      // Small delay to ensure the results section is rendered
      setTimeout(() => {
        const resultsSection = document.getElementById('results-section')
        if (resultsSection) {
          resultsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
    }
  }, [results])

  const scrollToResults = () => {
    const resultsSection = document.getElementById('results-section')
    if (resultsSection) {
      resultsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
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

  // Enforce auth/redirect based on role
  useEffect(() => {
    const auth = localStorage.getItem('auth')
    if (!auth) {
      // Not authenticated — send to login
      window.location.href = '/login'
      return
    }
    // If a patient is logged in, do NOT auto-redirect here to avoid
    // unexpected routing during in-app navigation. The patient can
    // navigate to /messages via the sidebar or the login flow.
    try {
      const user = JSON.parse(auth)
      // optional: could show a toast or UI hint here instead of redirecting
      console.debug('Logged in user:', user.username, 'role:', user.role)
    } catch (e) {
      window.location.href = '/login'
    }
  }, [])

  // Helper: append a message to localStorage for a recipient (messages:username)
  const appendMessageForUser = (recipient: string, message: any) => {
    if (!recipient) return false
    const key = `messages:${recipient}`
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      existing.push(message)
      localStorage.setItem(key, JSON.stringify(existing))
      return true
    } catch (e) {
      console.error('failed to append message', e)
      return false
    }
  }

  const sendResultsToPatient = () => {
    const authRaw = localStorage.getItem('auth')
    const user = authRaw ? JSON.parse(authRaw) : { username: 'Doctor' }
    const recipient = patientName?.trim()
    if (!recipient) {
      alert('Please enter patient name in Patient Info before sending results.')
      return
    }

    const msg = {
      from: user.username || 'Doctor',
      type: 'results',
      body: `Medical results for ${recipient}: ${results ? results.diagnosis || 'No diagnosis' : 'No results'}`,
      meta: { results },
      timestamp: Date.now()
    }

    const ok = appendMessageForUser(recipient, msg)
    if (ok) alert('Results sent to patient portal')
  }

  return (
    <div className="flex h-screen min-h-screen bg-base overflow-clip">
      <Sidebar />
      <div className='flex-1 overflow-auto p-6'>
        <div className="max-w-6xl mx-auto">

          {/* Patient Info - Show search form when no patient selected, display card when patient selected */}
          {!activePatient ? (
            <PatientInfoCard 
              patientName={patientName}
              setPatientName={setPatientName}
              patientDob={patientDob}
              setPatientDob={setPatientDob}
            />
          ) : (
            <PatientDisplayCard />
          )}
          
          {/* Input Cards - Only show when a patient is selected */}
          {activePatient && (
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
          )}
          
          {/* Results Area */}
          {displayResults && (
            <div className="medical-card">
              <ResultsCard results={displayResults} />
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
                <User className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Medical Dashboard
              </h3>
              <p className="text-gray-500 mb-4">
                Select an existing patient from the sidebar or enter patient information below to get started with medical documentation.
              </p>
              <div className="text-sm text-gray-400">
                Enter patient details to begin searching or creating patient records
              </div>
            </div>)}
          </div>
      </div>
    </div>
  )
}
