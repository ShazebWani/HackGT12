import { useState } from 'react'
import { Upload, FileText, Edit3, ToggleLeft, ToggleRight } from 'lucide-react'

interface TextFileUploadProps {
  onFileUpload: (file: File) => void
  onTextInput?: (text: string) => void
}

const TextFileUploadCard = ({ onFileUpload, onTextInput }: TextFileUploadProps) => {
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isNotepadMode, setIsNotepadMode] = useState(false)
  const [noteText, setNoteText] = useState('')

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setUploadedFile(file)
        onFileUpload(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      onFileUpload(file)
    }
  }

  const handleNoteSubmit = () => {
    if (noteText.trim() && onTextInput) {
      // Create a virtual file-like object for consistency
      const blob = new Blob([noteText], { type: 'text/plain' })
      const file = new File([blob], 'notepad-entry.txt', { type: 'text/plain' })
      onFileUpload(file)
      onTextInput(noteText)
    }
  }

  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isNotepadMode ? (
            <Edit3 className="h-5 w-5 text-accent-1" />
          ) : (
            <FileText className="h-5 w-5 text-accent-1" />
          )}
          <h3 className="text-lg font-semibold text-accent-1">
            {isNotepadMode ? 'Quick Notes' : 'Text File Upload'}
          </h3>
        </div>
        
        {/* Mode Toggle - Animated Switch */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium transition-colors duration-300 ${
            !isNotepadMode ? 'text-accent-1' : 'text-gray-500'
          }`}>Upload</span>
          <button
            onClick={() => setIsNotepadMode(!isNotepadMode)}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 transition-colors duration-300 hover:bg-gray-300"
            style={{
              backgroundColor: isNotepadMode ? '#095d7e' : '#e5e7eb'
            }}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                isNotepadMode ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isNotepadMode ? 'text-accent-1' : 'text-gray-500'
          }`}>Notes</span>
        </div>
      </div>
      
      {/* Content Area with Fade Transition */}
      <div className="relative min-h-[40vh]">
        {/* Notepad Mode */}
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          isNotepadMode 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="h-full flex flex-col space-y-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter patient notes, observations, or any text content..."
              className="flex-1 min-h-[25vh] w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-transparent transition-all duration-200"
            />
            <div className="flex justify-between items-center flex-shrink-0">
              <p className="text-xs text-gray-500">
                {noteText.length} characters
              </p>
              <button
                onClick={handleNoteSubmit}
                disabled={!noteText.trim()}
                className="px-8 py-4 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg min-w-[12rem] min-h-[3.5rem]"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {/* File Upload Mode */}
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          !isNotepadMode 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            className={`h-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 flex flex-col items-center justify-center ${
              dragOver 
                ? 'border-accent-1 bg-accent-1/5' 
                : 'border-gray-300 hover:border-accent-1/50'
            }`}
          >
            <Upload className={`h-16 w-16 mx-auto mb-6 ${
              dragOver ? 'text-accent-1' : 'text-gray-400'
            }`} />
            
            {uploadedFile ? (
              <div className="text-center">
                <p className="text-accent-1 font-medium mb-3 text-lg">✓ File uploaded</p>
                <p className="text-gray-600 mb-2">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-3 text-lg">
                  Drag and drop a text file here
                </p>
                <p className="text-gray-500 mb-8">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="text-file-input"
                />
                <label
                  htmlFor="text-file-input"
                  className="inline-block px-8 py-4 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors cursor-pointer font-medium text-lg min-w-[12rem] min-h-[3.5rem]"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p className="transition-opacity duration-300">
          {isNotepadMode 
            ? 'Type notes directly or switch to upload mode for text files'
            : 'Upload existing transcripts or notes (.txt files only)'
          }
        </p>
      </div>
    </div>
  )
}

export default TextFileUploadCard