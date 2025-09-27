import { useCallback, useEffect, useRef, useState } from 'react'
// import { Button } from './ui/button'
import clsx from 'clsx'

type Props = {
  status: 'idle' | 'recording'
  startRecording: () => void
  stopRecording: () => void
  onResults?: (results: any) => void
}

export default function AudioRecorder({ status, startRecording, stopRecording, onResults }: Props) {
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRef = useRef<MediaStream | null>(null)
  const procRef = useRef<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
          onResults?.({ transcription: data.data.transcription, isFinal: true })
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
    if (status === 'idle') {
      start().catch(console.error)
    } else {
      // Stop recording - stopAll will handle setting isProcessing
      stopAll()
    }
  }, [status]) // Make sure to include dependencies used in start() and stopAll() if any

  useEffect(() => {
    return () => stopAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <div
          className={clsx(
            'h-16 w-16 rounded-full transition-all flex items-center justify-center',
            isProcessing
              ? 'animate-spin bg-blue-500'
              : status === 'recording'
                ? 'animate-pulse bg-red-500'
                : 'bg-gray-300'
          )}
          aria-hidden
        >
          {isProcessing ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'recording' ? (
            <div className="w-4 h-4 bg-white rounded-sm" />
          ) : (
            <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1" />
          )}
        </div>

        {/* <Button
          onClick={handleRecordClick}
          disabled={isProcessing}
          className={clsx('px-8 py-3 text-base font-medium', status === 'recording' && 'bg-red-600 hover:bg-red-700', isProcessing && 'opacity-50 cursor-not-allowed')}
        >
          {isProcessing ? 'Processing...' : status === 'idle' ? 'Record' : 'Stop'}
        </Button> */}

        <p className="text-sm text-gray-600 text-center">
          {isProcessing ? 'Processing your recording...' : status === 'recording' ? 'Recording… tap Stop to finish' : 'Tap Record to start'}
        </p>
      </div>

      <div className="text-xs text-gray-500 space-y-1 mt-4">
        <p>• Make sure your microphone is enabled</p>
        <p>• Speak clearly and at normal pace</p>
        <p>• Click stop when finished to get final results</p>
      </div>
    </div>
  )
}