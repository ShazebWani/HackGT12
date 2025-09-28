import { useState, useCallback } from 'react'
import { FileText, Send, Loader2 } from 'lucide-react'

interface TextContextProps {
  onTextSubmit: (text: string) => void
  isProcessing?: boolean
}

const TextContextCard = ({ onTextSubmit, isProcessing = false }: TextContextProps) => {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      alert('Please enter some text before submitting')
      return
    }

    setIsSubmitting(true)
    
    try {
      await onTextSubmit(text.trim())
      setText('') // Clear the text after successful submission
    } catch (error) {
      console.error('Error submitting text:', error)
      alert('Failed to process text. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [text, onTextSubmit])

  const handleClear = () => {
    setText('')
  }

  const isDisabled = isProcessing || isSubmitting || !text.trim()

  return (
    <div className="medical-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-accent-1" />
        <h3 className="text-lg font-semibold text-accent-1">Text Context Input</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Visit Notes or Context
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter patient visit notes, symptoms, observations, or any relevant medical context..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors resize-none"
            rows={8}
            disabled={isProcessing || isSubmitting}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {text.length} characters
            </span>
            <span className="text-xs text-gray-500">
              {text.split('\n').length} lines
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Process with SOAP Agent
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={isProcessing || isSubmitting || !text.trim()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Enter patient visit notes, symptoms, or medical observations to generate SOAP notes and medical documentation.</p>
      </div>
    </div>
  )
}

export default TextContextCard
