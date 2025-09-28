import { useState } from 'react'
import { Upload, Edit3, File, X } from 'lucide-react'

interface TextFileUploadProps {
  onFileUpload: (file: File) => void
  onTextInput?: (text: string) => void
  onTextContextProcessed?: (results: any) => void
}

interface UploadedFile {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  extractedText?: string
}

const TextFileUploadCard = ({ onFileUpload, onTextInput, onTextContextProcessed }: TextFileUploadProps) => {
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isNotepadMode, setIsNotepadMode] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)


  const addFile = (file: File) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending'
    }
    setUploadedFiles(prev => [...prev, newFile])
    return newFile
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileStatus = (fileId: string, status: UploadedFile['status'], extractedText?: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status, extractedText }
        : f
    ))
  }

  const handleFileDrop = async (file: File) => {
    const uploadedFile = addFile(file)
    
    // If it's a PDF, process it through the backend
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      await processPDFFile(file, uploadedFile.id)
    } else {
      // For text files, just upload normally
      onFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => 
      file.type === 'text/plain' || file.name.endsWith('.txt') || 
      file.type === 'application/pdf' || file.name.endsWith('.pdf')
    )
    
    if (validFiles.length > 0) {
      validFiles.forEach(file => addFile(file))
    } else {
      alert('Please upload .txt or .pdf files')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => 
      file.type === 'text/plain' || file.name.endsWith('.txt') || 
      file.type === 'application/pdf' || file.name.endsWith('.pdf')
    )
    
    if (validFiles.length > 0) {
      validFiles.forEach(file => addFile(file))
    } else {
      alert('Please upload .txt or .pdf files')
    }
    
    // Reset the input so the same file can be selected again
    e.target.value = ''
  }

  const processTextContext = async (text: string) => {
    if (!text.trim()) return
    
    setIsProcessing(true)
    try {
      console.log('📝 Processing text context:', text.substring(0, 100) + '...')
      
      const response = await fetch('/api/process-text-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          context_type: 'medical_notes'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const results = await response.json()
      console.log('✅ Text context processed successfully:', results)
      
      // Call the callback to handle the results
      if (onTextContextProcessed) {
        onTextContextProcessed(results)
      }
      
      // Also call the original text input callback for compatibility
      if (onTextInput) {
        onTextInput(text)
      }
      
    } catch (error) {
      console.error('❌ Error processing text context:', error)
      // Still call the text input callback as fallback
      if (onTextInput) {
        onTextInput(text)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const processPDFFile = async (file: File, fileId: string) => {
    updateFileStatus(fileId, 'processing')
    try {
      console.log('📄 Processing PDF file:', file.name)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const results = await response.json()
      console.log('✅ PDF processed successfully:', results)
      
      updateFileStatus(fileId, 'completed', results.transcription)
      
    } catch (error) {
      console.error('❌ Error processing PDF:', error)
      updateFileStatus(fileId, 'error')
      alert(`Error processing PDF file ${file.name}. Please try again.`)
    }
  }

  const processAllFiles = async () => {
    if (uploadedFiles.length === 0) return
    
    setIsProcessing(true)
    try {
      console.log('📁 Processing multiple files:', uploadedFiles.length)
      
      // Create FormData with all files
      const formData = new FormData()
      uploadedFiles.forEach(uploadedFile => {
        formData.append('files', uploadedFile.file)
      })
      
      // Send all files to the backend for processing
      const response = await fetch('/api/process-multiple-files', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const results = await response.json()
      console.log('✅ Multiple files processed successfully:', results)
      
      // Call the callback to handle the results
      if (onTextContextProcessed) {
        onTextContextProcessed(results)
      }
      
      // Mark all files as completed
      uploadedFiles.forEach(uploadedFile => {
        updateFileStatus(uploadedFile.id, 'completed')
      })
      
    } catch (error) {
      console.error('❌ Error processing multiple files:', error)
      alert('Error processing files. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Notes entered here are saved locally; processing occurs when audio recording stops

  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isNotepadMode ? (
            <Edit3 className="h-5 w-5 text-accent-1" />
          ) : (
            <File className="h-5 w-5 text-accent-1" />
          )}
          <h3 className="text-lg font-semibold text-accent-1">
            {isNotepadMode ? 'Quick Notes' : 'File Upload'}
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
                {noteText.length} characters • Notes will be processed when recording is stopped
              </p>
            </div>
          </div>
        </div>

        {/* File Upload Mode */}
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          !isNotepadMode 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="h-full flex flex-col">
            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 flex flex-col items-center justify-center ${
                dragOver 
                  ? 'border-accent-1 bg-accent-1/5' 
                  : 'border-gray-300 hover:border-accent-1/50'
              }`}
            >
              <Upload className={`h-16 w-16 mx-auto mb-6 ${
                dragOver ? 'text-accent-1' : 'text-gray-400'
              }`} />
              
              <div className="text-center">
                <p className="text-gray-600 mb-3 text-lg">
                  Drag and drop files here
                </p>
                <p className="text-gray-500 mb-2">
                  Supports .txt and .pdf files
                </p>
                <p className="text-gray-500 mb-8">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".txt,.pdf,text/plain,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                  multiple
                />
                <label
                  htmlFor="file-input"
                  className="inline-block px-8 py-4 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors cursor-pointer font-medium text-lg min-w-[12rem] min-h-[3.5rem]"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {uploadedFiles.map((uploadedFile) => (
                    <div key={uploadedFile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <File className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{uploadedFile.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.file.size / 1024).toFixed(1)} KB
                            {uploadedFile.status === 'processing' && <span className="ml-2 text-accent-1">• Processing...</span>}
                            {uploadedFile.status === 'completed' && <span className="ml-2 text-green-600">• Ready</span>}
                            {uploadedFile.status === 'error' && <span className="ml-2 text-red-600">• Error</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(uploadedFile.id)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Process All Button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={processAllFiles}
                    disabled={isProcessing || uploadedFiles.length === 0}
                    className="px-8 py-4 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg min-w-[12rem] min-h-[3.5rem]"
                  >
                    {isProcessing ? 'Processing...' : `Process ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p className="transition-opacity duration-300">
          {isNotepadMode 
            ? 'Type notes directly or switch to upload mode for files'
            : 'Upload multiple files for comprehensive analysis (.txt and .pdf files supported)'
          }
        </p>
      </div>
    </div>
  )
}

export default TextFileUploadCard