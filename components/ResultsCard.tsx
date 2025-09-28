import { FileText, Pill, TestTube, CreditCard, User } from 'lucide-react'

interface ResultsCardProps {
  results: {
    transcription?: string
    soap_note?: string
    diagnosis?: string
    billing_code?: {
      code?: string
      description?: string
    }
    prescriptions?: Array<{
      medication?: string
      dosage?: string
      frequency?: string
      duration?: string
    }>
    lab_orders?: string[]
  }
}

interface ResultsCardPropsExtended extends ResultsCardProps {
  // No additional props needed
}

export default function ResultsCard({ results }: ResultsCardPropsExtended) {
  if (!results) {
    return null;
  }

  // Debug logging to see what data we're receiving
  console.log("🔍 ResultsCard received data:", results);
  console.log("🔍 Prescriptions data:", results.prescriptions);
  console.log("🔍 Lab orders data:", results.lab_orders);
  console.log("🔍 Prescriptions length:", results.prescriptions?.length);
  console.log("🔍 Lab orders length:", results.lab_orders?.length);

  return (
    <div className="medical-card w-full mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-accent-1" />
        <h3 className="text-lg font-semibold text-accent-1">Medical Documentation</h3>
      </div>

      {/* Summary Cards */}
      <div className="p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border-2 border-accent-1/20 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-5 w-5 text-accent-1" />
              <h4 className="font-medium text-accent-1">Diagnosis</h4>
            </div>
            <p className="text-gray-800 capitalize">{results.diagnosis || 'Not specified'}</p>
          </div>
          
          <div className="border-2 border-accent-1/20 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="h-5 w-5 text-accent-1" />
              <h4 className="font-medium text-accent-1">Billing Code</h4>
            </div>
            <p className="text-gray-800 font-mono">{results.billing_code?.code || 'Not specified'}</p>
            <p className="text-gray-700 text-sm mt-1">{results.billing_code?.description || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Full content sections */}
      <div className="space-y-6">
        {/* Transcription */}
        <div className="rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">Original Transcription</h4>
          </div>
            <p className="border-2 border-accent-1/20 rounded-lg p-4 text-gray-700 italic leading-relaxed">"{results.transcription || 'Not specified'}"</p>
        </div>

        {/* SOAP Note */}
        <div className="rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">SOAP Note</h4>
          </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans border-2 border-accent-1/20 p-4 rounded-lg">
            {results.soap_note || 'Not specified'}
          </pre>
        </div>

        {/* Prescriptions */}
        <div className="rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Pill className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">Prescriptions</h4>
          </div>
          
          
          
          <div className="space-y-3">
            {results.prescriptions && results.prescriptions.length > 0 ? (
              results.prescriptions.map((prescription, index) => (
                  <div
                    key={index}
                    className="rounded-lg p-4 border-2 border-accent-1/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-accent-1 text-lg">{prescription.medication || 'Not specified'}</span>
                      <span className="text-accent-2 font-medium">{prescription.dosage || 'Not specified'}</span>
                    </div>
                    <p className="text-gray-700">
                      {prescription.frequency || 'Not specified'} for {prescription.duration || 'Not specified'}
                    </p>
                  </div>
              ))
            ) : (
              <div className="rounded-lg p-4 border-2 border-accent-1/20">
                <span className="text-gray-800 font-medium">Not specified</span>
              </div>
            )}
          </div>
        </div>

        {/* Lab Orders */}
        <div className="rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TestTube className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">Lab Orders</h4>
          </div>
          
          
          
          <div className="space-y-2">
            {results.lab_orders && results.lab_orders.length > 0 ? (
              results.lab_orders.map((order, index) => (
                  <div
                    key={index}
                    className="rounded-lg px-4 py-3 border-2 border-accent-1/20"
                  >
                    <span className="text-gray-800 capitalize font-medium">{order || 'Not specified'}</span>
                  </div>
              ))
            ) : (
              <div className="rounded-lg px-4 py-3 border-2 border-accent-1/20">
                <span className="text-gray-800 font-medium">Not specified</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-accent-1/20">
          <button className="flex-1 bg-accent-1 hover:bg-accent-1/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200  ">
            Approve & Sign
          </button>
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200  ">
            Edit & Review
          </button>
        </div>
      </div>
    </div>
  )
}