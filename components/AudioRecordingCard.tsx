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
  const wsRef = useRef<WebSocket | null>(null)
  const [audioResults, setAudioResults] = useState<any>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  function getWsUrl() {
    if (typeof window === 'undefined') return 'ws://localhost:8000/ws/transcription'
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.hostname}:8000/ws/transcription`
  }

  // We use MediaRecorder to capture audio chunks in modern browsers.

  async function start() {
    setIsProcessing(false)
    startRecording()

    const ws = new WebSocket(getWsUrl())
    ws.onopen = () => console.log('WS open')

    ws.onmessage = (ev) => {

      try {
        const data = JSON.parse(ev.data as string)
        console.log('WS msg', data)

        if (data.type === "final_result") {
          setAudioResults?.({ transcription: data.data.transcription, isFinal: true })
          ws.close()  // close here, not earlier
          setIsProcessing(false)
        }

        if (data.type === 'stopped') {
          console.log('Transcription stopped by backend')
          setIsProcessing(false)
        }
      } catch (e) {
        console.warn('WS message parse error', e)
      }
    }

    ws.onclose = () => console.log('WS closed')
    ws.onerror = (e) => console.error('WS error', e)

    wsRef.current = ws
  }

  function stopAll() {
    // Tell backend to stop capturing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'END_OF_STREAM' }))
        // ONLY set isProcessing to true here, we wait for final_result to set it to false
        setIsProcessing(true)

      } catch (e) {
        console.error('Failed to send END_OF_STREAM', e)
        // If we fail to send, we should still stop recording and clear processing
        stopRecording()
        setIsProcessing(false)
      }
    } else {
      // If WebSocket wasn't open, just stop recording and clear state
      stopRecording()
      setIsProcessing(false)
    }

    // Update UI: stopRecording is called regardless
    stopRecording()
  }


  const handleRecordClick = useCallback(() => {
    if (audioStatus === 'idle') {
      startRecording()
      setIsProcessing(false)
      start().catch(console.error)
    } else {
      // On stop, simulate processing then set results
      stopRecording()
      setIsProcessing(false)
      stopAll()
    }
  }, [stopRecording])

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
          <p className="text-sm text-gray-500">Results: {audioResults?.transcription}</p>
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