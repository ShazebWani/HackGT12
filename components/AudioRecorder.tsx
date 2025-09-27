import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Play } from 'lucide-react'

interface AudioRecorderProps {
  onResults: (results: any) => void
  onProcessing: (processing: boolean) => void
}

export default function AudioRecorder({ onResults, onProcessing }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [status, setStatus] = useState<string>('Ready to record')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws/process-visit')
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      setStatus('Connected - Ready to record')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received:', data)
      
      if (data.type === 'partial_transcript') {
        setTranscription(data.text)
        setStatus('Transcribing...')
      } else if (data.type === 'final_result') {
        onResults(data.data)
        onProcessing(false)
        setStatus('Complete!')
        setTranscription('')
      } else if (data.type === 'audio_received') {
        setStatus(`Processing audio... (${data.bytes_received} bytes)`)
      } else if (data.type === 'error') {
        setStatus(`Error: ${data.message}`)
        onProcessing(false)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      setStatus('Disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setStatus('Connection error')
      setIsConnected(false)
    }

    websocketRef.current = ws
  }

  const startRecording = async () => {
    if (!isConnected) {
      connectWebSocket()
      // Wait a moment for connection
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          
          // Send audio chunk to WebSocket
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            event.data.arrayBuffer().then(buffer => {
              websocketRef.current?.send(buffer)
            })
          }
        }
      }

      mediaRecorder.start(1000) // Send chunks every 1 second
      setIsRecording(true)
      setStatus('Recording... Speak now!')
      setTranscription('')
      onResults(null)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setStatus('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setStatus('Processing final transcript...')
      onProcessing(true)
      
      // Send end of stream signal
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send('END_OF_STREAM')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`status-indicator ${isConnected ? 'status-success' : 'status-waiting'}`}>
        {isConnected ? '🟢 Connected' : '🟡 Not Connected'}
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isRecording && !isConnected}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110'
              : 'bg-medical-500 hover:bg-medical-600 text-white shadow-md'
          }`}
        >
          {isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
        
        <p className="text-sm font-medium text-gray-700">
          {isRecording ? 'Click to stop recording' : 'Click to start recording'}
        </p>
      </div>

      {/* Status Display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600 font-medium">Status: {status}</p>
      </div>

      {/* Live Transcription */}
      {transcription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Live Transcription:</h4>
          <p className="text-blue-800 italic">"{transcription}"</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Make sure your microphone is enabled</p>
        <p>• Speak clearly and at normal pace</p>
        <p>• Click stop when finished to get full analysis</p>
      </div>
    </div>
  )
}
