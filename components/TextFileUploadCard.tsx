import { useState } from 'react'
import { Upload, FileText } from 'lucide-react'

interface TextFileUploadProps {
  onFileUpload: (file: File) => void
}

const TextFileUploadCard = ({ onFileUpload }: TextFileUploadProps) => {
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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

  return (
    <div className="medical-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-accent-1" />
        <h3 className="text-lg font-semibold text-accent-1">Text File Upload</h3>
      </div>
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragOver 
            ? 'border-accent-1 bg-accent-1/5' 
            : 'border-gray-300 hover:border-accent-1/50'
        }`}
      >
        <Upload className={`h-12 w-12 mx-auto mb-4 ${
          dragOver ? 'text-accent-1' : 'text-gray-400'
        }`} />
        
        {uploadedFile ? (
          <div>
            <p className="text-accent-1 font-medium mb-2">✓ File uploaded</p>
            <p className="text-sm text-gray-600">{uploadedFile.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag and drop a text file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
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
              className="inline-block px-4 py-2 bg-accent-1 text-white rounded-lg hover:bg-accent-1/90 transition-colors cursor-pointer"
            >
              Choose File
            </label>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Upload existing transcripts or notes (.txt files only)</p>
      </div>
    </div>
  )
}

export default TextFileUploadCard