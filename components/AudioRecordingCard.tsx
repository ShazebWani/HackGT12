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
        setAudioResults(mockResults)
        handleRecordingResults(mockResults)
      }, 2200) // 2.2s processing simulation
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
      
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-8">
        <div className="text-center">
          <p className="text-gray-600 mb-6">Record patient consultation</p>
        </div>
        
        {/* Recording Controls */}
        <div className="flex flex-col items-center justify-center space-y-6 h-[20vh]">
          {isProcessing ? (
            // Heart Monitor Animation (copied from ProcessingIndicator)
            <div className="flex flex-col items-center justify-center">
              <div className="mb-2">
                <svg width="80" height="32" viewBox="0 0 80 32" className="heartbeat-svg">
                  {/* Background path (greyed out) */}
                  <path
                    d="M0 16 L15 16 L18 8 L22 24 L26 4 L30 28 L34 16 L80 16"
                    stroke="#d1d5db"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Animated path (traced over) */}
                  <path
                    d="M0 16 L15 16 L18 8 L22 24 L26 4 L30 28 L34 16 L80 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="heartbeat-trace text-accent-1"
                  />
                </svg>
              </div>
              <p className="text-accent-1 text-sm font-medium">Processing...</p>
              
              <style jsx>{`
                .heartbeat-trace {
                  stroke-dasharray: 120;
                  stroke-dashoffset: 120;
                  animation: trace 2s infinite ease-in-out;
                }
                
                @keyframes trace {
                  0% {
                    stroke-dashoffset: 120;
                  }
                  50% {
                    stroke-dashoffset: 0;
                  }
                  100% {
                    stroke-dashoffset: -120;
                  }
                }
              `}</style>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              {/* Audio Levels Graph */}
              <div className="flex items-end justify-center gap-1 h-16">
                {[...Array(12)].map((_, i) => {
                  const baseHeights = [8, 12, 18, 24, 32, 28, 36, 24, 18, 14, 10, 6];
                  const baseHeight = baseHeights[i];
                  
                  return (
                    <div
                      key={i}
                      className={clsx(
                        'w-1.5 rounded-sm transition-colors duration-200',
                        audioStatus === 'recording'
                          ? 'bg-accent-1 audio-level-bar'
                          : 'bg-gray-300'
                      )}
                      style={{
                        height: `${baseHeight}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  );
                })}
              </div>
              
              <style jsx>{`
                .audio-level-bar {
                  animation: audioLevel 0.8s ease-in-out infinite alternate;
                  transform-origin: bottom;
                }
                
                @keyframes audioLevel {
                  0% {
                    transform: scaleY(0.3);
                    opacity: 0.7;
                  }
                  50% {
                    transform: scaleY(1.2);
                    opacity: 1;
                  }
                  100% {
                    transform: scaleY(0.6);
                    opacity: 0.8;
                  }
                }
              `}</style>
              
              {/* Record Button - Standardized Size */}
              <button
                onClick={handleRecordClick}
                disabled={isProcessing}
                className={clsx(
                  'inline-flex items-center justify-center px-8 py-4 rounded-lg font-medium text-lg min-w-[12rem] min-h-[3.5rem] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                  audioStatus === 'recording' 
                    ? 'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500' 
                    : 'bg-accent-1 hover:bg-accent-1/90 text-white focus-visible:ring-accent-1'
                )}
              >
                <Mic className="h-5 w-5 mr-2" />
                {audioStatus === 'idle' ? 'Start Recording' : 'Stop Recording'}
              </button>
            </div>
          )}
        </div>
        
        {/* HIPAA Privacy Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">Audio recording is deleted after processing</p>
        </div>
      </div>
    </div>
  )
}

export default AudioRecordingCard