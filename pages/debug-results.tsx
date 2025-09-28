import { useState } from 'react'
import ResultsCard from '@/components/ResultsCard'

export default function DebugResults() {
  const [testData, setTestData] = useState({
    transcription: "Patient is a 45-year-old male here for a follow-up on his hypertension. He says he's been taking his lisinopril daily and has been checking his blood pressure, which is running about 130 over 80. No complaints of dizziness or side effects. Exam shows a BP of 128/82 and a heart rate of 70. Lungs are clear. We'll continue the current dose of lisinopril 10mg and see him back in 3 months.",
    soap_note: "SUBJECTIVE:\n He says he's been taking his lisinopril daily and has been checking his blood pressure, which is running about 130 over 80\n\nOBJECTIVE:\nPhysical Exam: Lungs clear to auscultation.\n\nASSESSMENT:\nHypertension\n\nPLAN:\n- Follow up as needed\n- Return if symptoms worsen",
    diagnosis: "Hypertension",
    billing_code: {
      code: "I10",
      description: "Essential hypertension"
    },
    prescriptions: [
      {
        medication: "lisinopril",
        dosage: "10mg",
        frequency: "daily",
        duration: "3 months"
      }
    ],
    lab_orders: ["CBC", "CMP", "Lipid panel"]
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Results Card</h1>
        
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Data:</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Results Card:</h2>
          <ResultsCard results={testData} />
        </div>
      </div>
    </div>
  )
}
