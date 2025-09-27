import { ChevronDown } from 'lucide-react'

interface ProcessingIndicatorProps {
  isProcessing: boolean
  hasResults: boolean
  onScrollToResults?: () => void
}

export default function ProcessingIndicator({ 
  isProcessing, 
  hasResults, 
  onScrollToResults 
}: ProcessingIndicatorProps) {
  if (isProcessing) {
    return (
      <div className="medical-card text-center w-full h-20 flex flex-col items-center justify-center">
        {/* Heart Monitor SVG Animation */}
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
        <p className="text-accent-1">Processing...</p>
        
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
    )
  }
  
  if (hasResults) {
    return (
      <div className="flex items-center justify-center h-20">
        <button
          onClick={onScrollToResults}
          className="mt-24 p-3 text-gray-500 hover:text-accent-1 hover:bg-black/5 rounded-full transition-colors animate-bounce"
          title="Scroll to results"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    )
  }
  
  return <div className="h-20"></div>
}