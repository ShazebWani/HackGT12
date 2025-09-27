import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import clsx from 'clsx'

interface AudioRecordingProps {
  audioStatus: 'idle' | 'recording'
  startRecording: () => void
  stopRecording: () => void
  handleRecordingResults: (results: any) => void
}

const AudioRecordingCard = ({ audioStatus, startRecording, stopRecording, handleRecordingResults }: AudioRecordingProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for audio recording (in-memory only)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Start audio recording (in-memory only)
  const startRealRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting audio recording...')
      setError(null)
      
      // Request microphone access
      console.log('📱 Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      console.log('✅ Microphone access granted')
      streamRef.current = stream
      
      // Create MediaRecorder for in-memory recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`📦 Storing audio chunk in memory: ${event.data.size} bytes`)
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped, processing audio...')
        processRecordedAudio()
      }
      
      mediaRecorder.start(1000) // Collect data every second
      console.log('🎵 MediaRecorder started - recording in memory only')
      startRecording()
      
    } catch (err) {
      console.error('❌ Error starting recording:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access and try again.')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.')
        } else {
          setError(`Failed to start recording: ${err.message}`)
        }
      } else {
        setError('Failed to access microphone. Please check permissions.')
      }
    }
  }, [startRecording])

  // Process the recorded audio (in-memory only)
  const processRecordedAudio = useCallback(async () => {
    try {
      console.log('🔄 Processing recorded audio...')
      setIsProcessing(true)
      
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded')
      }
      
      // Create a single audio blob from all chunks (in-memory only)
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
      console.log(`📊 Total audio size: ${audioBlob.size} bytes`)
      console.log(`📦 Number of audio chunks: ${audioChunksRef.current.length}`)
      
      // Convert to ArrayBuffer for sending
      const arrayBuffer = await audioBlob.arrayBuffer()
      console.log(`📤 ArrayBuffer size: ${arrayBuffer.byteLength} bytes`)
      
      // Send to backend for processing
      console.log('🚀 Sending audio to backend...')
      const response = await fetch('http://localhost:8001/api/process-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
        },
        body: arrayBuffer
      })
      console.log(`📡 Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Received processing result:', result)
      
      handleRecordingResults(result)
      setIsProcessing(false)
      
      // Clear audio data from memory after processing
      audioChunksRef.current = []
      console.log('🗑️ Audio data cleared from memory')
      
    } catch (err) {
      console.error('❌ Error processing audio:', err)
      setError(`Failed to process audio: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsProcessing(false)
    }
  }, [handleRecordingResults])

  // Stop recording and process audio
  const stopRealRecording = useCallback(() => {
    try {
      console.log('🛑 Stopping recording...')
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      // Stop audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      stopRecording()
      // Note: processRecordedAudio will be called automatically by the onstop event
      
    } catch (err) {
      console.error('❌ Error stopping recording:', err)
      setError('Error stopping recording')
    }
  }, [stopRecording])

  const handleRecordClick = useCallback(() => {
    if (audioStatus === 'idle') {
      startRealRecording()
    } else {
      stopRealRecording()
    }
  }, [audioStatus, startRealRecording, stopRealRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      // Clear any remaining audio data
      audioChunksRef.current = []
    }
  }, [])

  return (
    <div className="medical-card">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="h-5 w-5 text-accent-1" />
        <h3 className="text-lg font-semibold text-accent-1">Audio Recording</h3>
      </div>
      
      <div className="text-center">
        <div className="mb-4">
          <p className="text-gray-600 mb-2">Record patient consultation</p>
          <p className="text-sm text-gray-500">Click to start/stop recording</p>
          
          {/* Error Display */}
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {/* Recording Status Display */}
          {audioStatus === 'recording' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 font-medium mb-1">Recording in progress...</p>
              <p className="text-sm text-red-700">Audio is being captured in memory. Click Stop when finished.</p>
            </div>
          )}
        </div>
        
        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div
            className={clsx(
              'h-16 w-16 rounded-full transition-all flex items-center justify-center',
              isProcessing 
                ? 'animate-spin bg-blue-500' 
                : audioStatus === 'recording' 
                  ? 'animate-pulse bg-red-500' 
                  : 'bg-gray-300'
            )}
            aria-hidden
          >
            {isProcessing ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : audioStatus === 'recording' ? (
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            ) : (
              <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1"></div>
            )}
          </div>
          
          <button
            onClick={handleRecordClick}
            disabled={isProcessing}
            className={clsx(
              'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
              'px-8 py-3 text-base font-medium',
              audioStatus === 'recording' 
                ? 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500',
              isProcessing && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? 'Processing...' : audioStatus === 'idle' ? 'Record' : 'Stop'}
          </button>
          
          <p className="text-sm text-gray-600 text-center">
            {isProcessing 
              ? 'Processing your recording...' 
              : audioStatus === 'recording' 
                ? 'Recording… tap Stop to finish' 
                : 'Tap Record to start'
            }
          </p>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1 mt-4">
          <p>• Allow microphone access when prompted</p>
          <p>• Speak clearly and at normal pace</p>
          <p>• Audio is recorded in memory only (not saved to disk)</p>
          <p>• Click stop when finished to get full analysis</p>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Audio data is processed and discarded after analysis</p>
        </div>
      </div>
    </div>
  )
}

export default AudioRecordingCard