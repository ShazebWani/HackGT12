import { useState, useRef } from 'react'
import { Upload, File, X } from 'lucide-react'

interface FileUploaderProps {
  onResults: (results: any) => void
  onProcessing: (processing: boolean) => void
}

export default function FileUploader({ onResults, onProcessing }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('Ready to upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type.startsWith('audio/') || selectedFile.name.endsWith('.wav') || selectedFile.name.endsWith('.mp3')) {
      setFile(selectedFile)
      setUploadStatus(`Selected: ${selectedFile.name}`)
      onResults(null) // Clear previous results
    } else {
      setUploadStatus('Please select an audio file (.wav, .mp3, etc.)')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploadStatus('Uploading...')
    onProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/process-visit', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const results = await response.json()
        onResults(results)
        setUploadStatus('Upload successful!')
      } else {
        setUploadStatus('Upload failed. Please try again.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('Network error. Make sure the backend is running.')
    } finally {
      onProcessing(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setUploadStatus('Ready to upload')
    onResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-medical-500 bg-medical-50'
            : file
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {file ? (
          <div className="space-y-3">
            <File className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <p className="font-medium text-green-800">{file.name}</p>
              <p className="text-sm text-green-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={clearFile}
              className="inline-flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
              <span>Remove</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">Drop audio file here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
            </div>
            <p className="text-xs text-gray-400">Supports .wav, .mp3, .m4a, .webm</p>
          </div>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* Browse Button */}
      {!file && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full medical-button"
        >
          Browse Files
        </button>
      )}

      {/* Upload Button */}
      {file && (
        <button
          onClick={uploadFile}
          className="w-full medical-button"
        >
          Process Audio File
        </button>
      )}

      {/* Status Display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600 font-medium">Status: {uploadStatus}</p>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported formats: WAV, MP3, M4A, WebM</p>
        <p>• Maximum file size: 50MB</p>
        <p>• Best quality: 16kHz, mono channel</p>
      </div>
    </div>
  )
}
