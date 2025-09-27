import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import PatientInfoCard from '../components/PatientInfoCard'
import AudioRecordingCard from '../components/AudioRecordingCard'
import TextFileUploadCard from '../components/TextFileUploadCard'
import ResultsDisplay from '../components/ResultsDisplay'

export default function Home() {
  const [patientName, setPatientName] = useState('')
  const [patientDob, setPatientDob] = useState('')
  const [results, setResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Audio recorder state
  const [audioStatus, setAudioStatus] = useState<'idle' | 'recording'>('idle')

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

  return (
    <div className="flex h-screen min-h-screen bg-base overflow-clip">
      <Sidebar />
      <div className='flex-1 overflow-auto p-6'>
        <div className="max-w-6xl mx-auto">
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
          {results && (
            <div className="medical-card">
              <ResultsDisplay results={results} />
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
