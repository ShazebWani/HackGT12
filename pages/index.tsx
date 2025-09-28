import { useState, useEffect, useCallback } from 'react'
import { User } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PatientInfoCard from '../components/PatientInfoCard'
import PatientDisplayCard from '../components/PatientDisplayCard'
import AudioRecordingCard from '../components/AudioRecordingCard'
import TextFileUploadCard from '../components/TextFileUploadCard'
import ResultsCard from '@/components/ResultsCard'
import TypeWriter from '@/components/TypeWriter'
import { usePatient } from '../contexts/PatientContext'

export default function Home() {
  const [patientName, setPatientName] = useState('')
  const [patientDob, setPatientDob] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResults, setCurrentResults] = useState<any>(null)
  const [results, setResults] = useState<any>(null)
  const [isAudio, setIsAudio] = useState<any>(null)

  // Audio recorder state
  const [audioStatus, setAudioStatus] = useState<'idle' | 'recording'>('idle')
  
  // Patient context
  const { state, activePatient, addMedicalRecord } = usePatient()

  const startRecording = () => {
    setAudioStatus('recording')
    setIsProcessing(false)
  }

  const stopRecording = () => {
    setAudioStatus('idle')
    setIsProcessing(true)
  }

  const handleRecordingResults = useCallback((recordingResults: any) => {
    if (!recordingResults) {
      return;
    }

    console.log("🔍 handleRecordingResults received:", recordingResults);
    console.log("🔍 Has transcription:", !!recordingResults.transcription);
    console.log("🔍 Has soap_note:", !!recordingResults.soap_note);
    console.log("🔍 Has prescriptions:", !!recordingResults.prescriptions);
    console.log("🔍 Has lab_orders:", !!recordingResults.lab_orders);

    // Check if we have structured medical data from SOAP agent
    if (recordingResults.transcription && recordingResults.soap_note) {
      // Full structured medical data - set as results for display
      console.log("✅ Setting full structured medical data as results");
      setResults(recordingResults);
      setIsProcessing(false);
    } else if (recordingResults.transcription) {
      // Just transcription (fallback)
      console.log("⚠️ Only transcription available, using fallback");
      const text = recordingResults.transcription;
      setIsAudio(text);
      setIsProcessing(!recordingResults.isFinal);
    }
  }, []);

  // Track results state changes
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
    // Here you could read the file content and process it
  }

  const handleTextContextProcessed = useCallback((results: any) => {
    if (!results) {
      return;
    }

    // Check if we have structured medical data from SOAP agent
    if (results.transcription && results.soap_note) {
      // Full structured medical data - set as results for display
      setResults(results);
      setIsProcessing(false);
    }
  }, []);



  // Only show results from SOAP agent, not patient mock data
  const displayResults = results;
  

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

  // Clear results when active patient changes
  useEffect(() => {
    setCurrentResults(null);
  }, [activePatient?.id]);

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

  return (
    <div className="flex h-screen min-h-screen bg-base overflow-clip">
      <Sidebar />
      <div className='flex-1 overflow-auto'>
        <div className="h-full flex flex-col">

          {/* Patient Info - Show search form when no patient selected, display card when patient selected */}
          {!activePatient ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-accent-1 mb-4">
                  Hi I'm ScribeAgentAI
                </h1>
                <div className="text-lg text-gray-600">
                  <TypeWriter 
                    text="Input patient info to begin"
                    speed={40}
                    className="text-lg text-gray-600"
                  />
                </div>
              </div>
              <div className="w-full px-32">
                <PatientInfoCard 
                  patientName={patientName}
                  setPatientName={setPatientName}
                  patientDob={patientDob}
                  setPatientDob={setPatientDob}
                />
              </div>
            </div>
          ) : (
            <div className="min-h-screen">
              {/* Centered patient section */}
              <div className="min-h-screen flex flex-col justify-center p-12">
                <div className="w-full px-8">
                  <PatientDisplayCard />
                
                  {/* Input Cards - Only show when a patient is selected */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AudioRecordingCard 
                      audioStatus={audioStatus}
                      startRecording={startRecording}
                      stopRecording={stopRecording}
                      handleRecordingResults={handleRecordingResults}
                    />
                    
                    <TextFileUploadCard 
                      onFileUpload={handleTextFileUpload}
                      onTextContextProcessed={handleTextContextProcessed}
                    />
                  </div>
                </div>
              </div>
              
              {/* Results Display - Off screen below */}
              {results && (
                <div className="p-8">
                  <div className="max-w-none mx-auto px-8">
                    <div id="results-section" className="medical-card">
                      <ResultsCard 
                        results={results}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
