import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PatientInfoCard from '../components/PatientInfoCard'
import AudioRecordingCard from '../components/AudioRecordingCard'
import TextFileUploadCard from '../components/TextFileUploadCard'
import ResultsCard from '@/components/ResultsCard'
import ProcessingIndicator from '@/components/ProcessingIndicator'

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

  return (
    <div className="flex h-screen min-h-screen bg-base overflow-clip">
      <Sidebar />
      <div className='flex-1 overflow-auto'>
        {/* Input Section - Full Viewport Height */}
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-4xl space-y-6">
            {/* Patient Info */}
            <PatientInfoCard 
              patientName={patientName}
              setPatientName={setPatientName}
              patientDob={patientDob}
              setPatientDob={setPatientDob}
            />
            
            {/* Input Cards */}
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
            
            {/* Processing indicator */}
            <ProcessingIndicator 
              isProcessing={isProcessing} 
              hasResults={!!results}
              onScrollToResults={scrollToResults}
            />
          </div>
        </div>

        {/* Results Section - Below the fold */}
        {results && (
          <div id="results-section" className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
              <ResultsCard results={results} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
