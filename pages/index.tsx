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
    console.log("🎤 Recording results received:", recordingResults);

    if (!recordingResults) {
      console.log("❌ No recording results provided");
      return;
    }

    // Check if we have structured medical data from SOAP agent
    if (recordingResults.transcription && recordingResults.soap_note) {
      // Full structured medical data - set as results for display
      console.log("✅ Setting SOAP agent results:", recordingResults);
      console.log("📊 Data structure check:", {
        hasTranscription: !!recordingResults.transcription,
        hasSoapNote: !!recordingResults.soap_note,
        hasDiagnosis: !!recordingResults.diagnosis,
        hasBillingCode: !!recordingResults.billing_code,
        prescriptionsCount: recordingResults.prescriptions?.length || 0
      });
      
      setResults(recordingResults);
      setIsProcessing(false);
      
      console.log("🔄 Results state should now be updated");
    } else if (recordingResults.transcription) {
      // Just transcription (fallback)
      console.log("⚠️ Only transcription received, no SOAP data");
      const text = recordingResults.transcription;
      setIsAudio(text);
      setIsProcessing(!recordingResults.isFinal);
    } else {
      console.log("❌ No valid data received from recording");
    }
  }, []);

  // Track results state changes
  useEffect(() => {
    console.log("🔄 Results state changed:", results);
    if (results) {
      console.log("✅ Results are now available for display");
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
    } else {
      console.log("❌ No results available");
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

  // Test function to manually set results
  const testSetResults = () => {
    const testData = {
      transcription: "Test transcription from manual button",
      soap_note: "SUBJECTIVE:\nTest patient with test symptoms.\n\nOBJECTIVE:\nTest findings.\n\nASSESSMENT:\nTest diagnosis.\n\nPLAN:\nTest treatment plan.",
      diagnosis: "Test Diagnosis",
      billing_code: { code: "Z00.00", description: "Test billing code" },
      prescriptions: [{ medication: "Test Med", dosage: "100mg", frequency: "twice daily", duration: "7 days" }],
      lab_orders: ["Test Lab Order"]
    };
    console.log("🧪 Setting test results manually:", testData);
    setResults(testData);
  }


  // Only show results from SOAP agent, not patient mock data
  const displayResults = results;
  
  // Debug logging
  console.log("🔍 Debug - results state:", results);
  console.log("🔍 Debug - displayResults:", displayResults);
  console.log("🔍 Debug - isProcessing:", isProcessing);
  console.log("🔍 Debug - activePatient:", activePatient);

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
                    />
                  </div>
                </div>
              </div>
              
              {/* Results Display - Off screen below */}
              {currentResults && (
                <div className="p-8">
                  <div className="max-w-none mx-auto px-8">
                    <div id="results-section" className="medical-card">
                      <ResultsCard 
                        results={currentResults}
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
