import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FileText, Pill, TestTube, CreditCard, User, ChevronRight } from 'lucide-react'

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
  const [isExpanded, setIsExpanded] = useState(false)

  if (!results) return null

  return (
    <div>
      <AnimatePresence>
        {/* Dark overlay when expanded */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Compact card - visible when not expanded */}
      {!isExpanded && (
        <motion.div
          layoutId="results-card"
          onClick={() => setIsExpanded(true)}
          className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer p-6"
          transition={{ duration: 0.6, type: "spring", bounce: 0.1 }}
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <p className="text-green-700 text-sm mt-1">{results.billing_code.description}</p>
            </div>
          </div>

          {/* Expand hint */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 px-4 py-2 text-medical-600 bg-medical-50 rounded-lg border border-medical-200">
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm font-medium">Click to expand full results</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded card - visible when expanded */}
      {isExpanded && (
        <motion.div
          layoutId="results-card"
          className="fixed inset-4 z-50 bg-white rounded-lg border border-gray-200 shadow-2xl p-8 overflow-auto"
          transition={{ duration: 0.6, type: "spring", bounce: 0.1 }}
        >
          {/* Close button */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">Medical Documentation</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <p className="text-green-700 text-sm mt-1">{results.billing_code.description}</p>
            </div>
          </div>

          {/* Full content sections */}
          <div className="space-y-6">
            {/* Transcription */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">Original Transcription</h4>
              </div>
              <p className="text-gray-700 italic leading-relaxed text-base">"{results.transcription}"</p>
            </div>

            {/* SOAP Note */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6 text-medical-600" />
                <h4 className="text-lg font-semibold text-gray-900">SOAP Note</h4>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50 p-4 rounded-lg">
                {results.soap_note}
              </pre>
            </div>

            {/* Prescriptions */}
            {results.prescriptions.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Pill className="h-6 w-6 text-purple-600" />
                  <h4 className="text-lg font-semibold text-purple-900">Prescriptions</h4>
                </div>
                <div className="space-y-3">
                  {results.prescriptions.map((prescription, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-900 text-lg">{prescription.medication}</span>
                        <span className="text-purple-600 font-medium">{prescription.dosage}</span>
                      </div>
                      <p className="text-purple-700">
                        {prescription.frequency} for {prescription.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Orders */}
            {results.lab_orders.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TestTube className="h-6 w-6 text-orange-600" />
                  <h4 className="text-lg font-semibold text-orange-900">Lab Orders</h4>
                </div>
                <div className="space-y-2">
                  {results.lab_orders.map((order, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg px-4 py-3 border border-orange-200 shadow-sm"
                    >
                      <span className="text-orange-800 capitalize font-medium">{order}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button className="flex-1 bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
                Approve & Sign
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
                Edit & Review
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}