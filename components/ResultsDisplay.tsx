import { FileText, Pill, TestTube, CreditCard, User } from 'lucide-react'

interface ResultsDisplayProps {
  results: {
    transcription: string
    soap_note: string
    diagnosis: string
    billing_code: {
      code: string
      description: string
    }
    prescriptions: Array<{
      medication: string
      dosage: string
      frequency: string
      duration: string
    }>
    lab_orders: string[]
  }
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  if (!results) return null

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Diagnosis</h4>
          </div>
          <p className="text-blue-800 capitalize">{results.diagnosis}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Billing Code</h4>
          </div>
          <p className="text-green-800 font-mono">{results.billing_code.code}</p>
        </div>
      </div>

      {/* Transcription */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Original Transcription</h4>
        </div>
        <p className="text-gray-700 italic leading-relaxed">"{results.transcription}"</p>
      </div>

      {/* SOAP Note */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="h-5 w-5 text-medical-600" />
          <h4 className="font-medium text-gray-900">SOAP Note</h4>
        </div>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
          {results.soap_note}
        </pre>
      </div>

      {/* Prescriptions */}
      {results.prescriptions.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Pill className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">Prescriptions</h4>
          </div>
          <div className="space-y-2">
            {results.prescriptions.map((prescription, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-900">{prescription.medication}</span>
                  <span className="text-sm text-purple-600">{prescription.dosage}</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  {prescription.frequency} for {prescription.duration}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab Orders */}
      {results.lab_orders.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <TestTube className="h-5 w-5 text-orange-600" />
            <h4 className="font-medium text-orange-900">Lab Orders</h4>
          </div>
          <div className="space-y-1">
            {results.lab_orders.map((order, index) => (
              <div key={index} className="bg-white rounded px-3 py-2 border border-orange-200">
                <span className="text-orange-800 capitalize">{order}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <button className="flex-1 bg-medical-600 hover:bg-medical-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
          Approve & Sign
        </button>
        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200">
          Edit & Review
        </button>
      </div>
    </div>
  )
}
