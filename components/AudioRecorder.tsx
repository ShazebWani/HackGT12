import { useRouter } from 'next/router'
import { useCallback, useRef, useState } from 'react'
import { Button } from './ui/button'
import clsx from 'clsx'

type Props = {
  status: 'idle' | 'recording'
  startRecording: () => void
  stopRecording: () => void
  /** Optional: override results route (defaults to /results) */
  resultsPath?: string
}

export default function AudioRecorder({
  status,
  startRecording,
  stopRecording,
  resultsPath = '/results',
}: Props) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRecordClick = useCallback(() => {
    if (status === 'idle') {
      startRecording()
      setIsProcessing(false)
    } else {
      // On stop, simulate processing then navigate
      stopRecording()
      setIsProcessing(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        router.push(resultsPath)
      }, 2200) // 2.2s feels snappy
    }
  }, [status, startRecording, stopRecording, router, resultsPath])

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
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
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : status === 'recording' ? (
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          ) : (
            <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1"></div>
          )}
        </div>
        
        <Button
          onClick={handleRecordClick}
          disabled={isProcessing}
          className={clsx(
            'px-8 py-3 text-base font-medium',
            status === 'recording' && 'bg-red-600 hover:bg-red-700',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isProcessing ? 'Processing...' : status === 'idle' ? 'Record' : 'Stop'}
        </Button>
        
        <p className="text-sm text-gray-600 text-center">
          {isProcessing 
            ? 'Processing your recording...' 
            : status === 'recording' 
              ? 'Recording… tap Stop to finish' 
              : 'Tap Record to start'
          }
        </p>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1 mt-4">
        <p>• Make sure your microphone is enabled</p>
        <p>• Speak clearly and at normal pace</p>
        <p>• Click stop when finished to get full analysis</p>
      </div>
    </div>
  )
}
