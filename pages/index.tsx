import { useState } from 'react'
import { Mic, Upload, FileText, Stethoscope, Clock, CheckCircle } from 'lucide-react'
import AudioRecorder from '../components/AudioRecorder'
import FileUploader from '../components/FileUploader'
import ResultsDisplay from '../components/ResultsDisplay'

export default function Home() {
  const [mode, setMode] = useState<'streaming' | 'upload'>('streaming')
  const [results, setResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Audio recorder state
  const [audioStatus, setAudioStatus] = useState<'idle' | 'recording'>('idle')

  const startRecording = () => {
    setAudioStatus('recording')
    // Clear any existing results when starting new recording
    setResults(null)
    setIsProcessing(false)
  }
  
  const stopRecording = () => {
    setAudioStatus('idle')
    // Start processing state when recording stops
    setIsProcessing(true)
  }

  const handleRecordingResults = (recordingResults: any) => {
    // Set the results from the recording
    setResults(recordingResults)
    setIsProcessing(false)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-8 w-8 text-medical-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ScribeAgent AI</h1>
                <p className="text-sm text-gray-600">Intelligent Medical Transcription</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Backend Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selection */}
        <div className="medical-card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('streaming')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                mode === 'streaming'
                  ? 'border-medical-500 bg-medical-50 text-medical-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Mic className="h-6 w-6" />
                <div className="text-left">
                  <h3 className="font-medium">Real-time Streaming</h3>
                  <p className="text-sm text-gray-600">Live transcription as you speak</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setMode('upload')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                mode === 'upload'
                  ? 'border-medical-500 bg-medical-50 text-medical-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6" />
                <div className="text-left">
                  <h3 className="font-medium">File Upload</h3>
                  <p className="text-sm text-gray-600">Upload pre-recorded audio</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Processing Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="medical-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              {mode === 'streaming' ? <Mic className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              <span>{mode === 'streaming' ? 'Voice Dictation' : 'File Upload'}</span>
            </h3>
            
            {mode === 'streaming' ? (
              <AudioRecorder
                status={audioStatus}
                startRecording={startRecording}
                stopRecording={stopRecording}
                onResults={handleRecordingResults}
              />
            ) : (
              <FileUploader onResults={setResults} onProcessing={setIsProcessing} />
            )}
          </div>

          {/* Results Section */}
          <div className="medical-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Clinical Documentation</span>
            </h3>
            
            {isProcessing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-medical-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 mb-2">Processing your recording...</p>
                  <p className="text-sm text-gray-500">Transcribing audio and generating clinical documentation</p>
                </div>
              </div>
            ) : results ? (
              <ResultsDisplay results={results} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Results will appear here after processing</p>
              </div>
            )}
          </div>
        </div>

        {/* Demo Information */}
        <div className="mt-8 medical-card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Demo Ready</h4>
              <p className="text-blue-700 mt-1">
                Try saying: "Patient is a 34-year-old male presenting with sore throat, fever, and swollen lymph nodes. 
                Rapid strep test was positive. Diagnosis is acute streptococcal pharyngitis. 
                I'm prescribing Amoxicillin 500mg, twice daily for 10 days, and ordering a follow-up throat culture."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
