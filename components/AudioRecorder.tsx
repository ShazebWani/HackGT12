import { useRouter } from 'next/router'
import { useCallback, useRef, useState } from 'react'
import { Button } from './ui/button'
import clsx from 'clsx'

type Props = {
  status: 'idle' | 'recording'
  startRecording: () => void
  stopRecording: () => void
  /** Callback to set results after processing */
  onResults?: (results: any) => void
}

export default function AudioRecorder({
  status,
  startRecording,
  stopRecording,
  onResults,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRecordClick = useCallback(() => {
    if (status === 'idle') {
      startRecording()
      setIsProcessing(false)
    } else {
      // On stop, simulate processing then set results
      stopRecording()
      setIsProcessing(true)
      
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        // TODO: Backend team - replace this with real Whisper API call
        // For now, using mock data that matches ResultsDisplay interface
        const mockResults = {
          transcription: "Patient is a 34-year-old male presenting with sore throat, fever, and swollen lymph nodes. Rapid strep test was positive. Diagnosis is acute streptococcal pharyngitis. I'm prescribing Amoxicillin 500mg, twice daily for 10 days, and ordering a follow-up throat culture.",
          soap_note: `SUBJECTIVE:
34-year-old male presents with chief complaint of sore throat for 3 days. Patient reports associated fever (101.2°F), difficulty swallowing, and tender swollen lymph nodes in neck. Denies cough, runny nose, or body aches. No known sick contacts.

OBJECTIVE:
Vital Signs: T 101.2°F, BP 128/78, HR 88, RR 16, O2 Sat 98%
Physical Exam:
- HEENT: Erythematous throat with tonsillar exudate, tender anterior cervical lymphadenopathy
- Lungs: Clear to auscultation bilaterally
- Heart: Regular rate and rhythm

ASSESSMENT:
Acute streptococcal pharyngitis (strep throat)
Rapid strep test: Positive

PLAN:
1. Antibiotic therapy: Amoxicillin 500mg PO BID x 10 days
2. Supportive care: Rest, fluids, throat lozenges
3. Follow-up throat culture in 48-72 hours
4. Return if symptoms worsen or no improvement in 3-4 days`,
          diagnosis: "acute streptococcal pharyngitis",
          billing_code: {
            code: "J02.0",
            description: "Streptococcal pharyngitis"
          },
          prescriptions: [
            {
              medication: "Amoxicillin",
              dosage: "500mg",
              frequency: "Twice daily",
              duration: "10 days"
            },
            {
              medication: "Throat Lozenges",
              dosage: "As needed",
              frequency: "Every 2-4 hours",
              duration: "Until symptoms resolve"
            }
          ],
          lab_orders: [
            "throat culture",
            "complete blood count with differential"
          ]
        }
        
        setIsProcessing(false)
        if (onResults) {
          onResults(mockResults)
        }
      }, 2200) // 2.2s processing simulation
    }
  }, [status, startRecording, stopRecording, onResults])

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
