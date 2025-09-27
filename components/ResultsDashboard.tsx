import { ScribeAgentResponse } from '../lib/types';
import { Button } from './ui/button';

interface ResultsDashboardProps {
  data: ScribeAgentResponse;
}

export default function ResultsDashboard({ data }: ResultsDashboardProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinical Documentation</h1>
        <p className="text-gray-600">Patient: {data.patientName} | Date: {data.dateOfService}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chief Complaint */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">Chief Complaint</h3>
          <p className="text-gray-700">{data.chiefComplaint}</p>
        </div>

        {/* History of Present Illness */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">History of Present Illness</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{data.historyOfPresentIllness}</p>
        </div>

        {/* Physical Exam */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm md:col-span-2">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">Physical Examination</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{data.physicalExam}</p>
        </div>

        {/* Assessment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-green-700 mb-3">Assessment</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{data.assessment}</p>
        </div>

        {/* Plan */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-green-700 mb-3">Plan</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{data.plan}</p>
        </div>
      </div>

      {/* Prescriptions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Prescriptions</h3>
        <div className="space-y-4">
          {data.prescriptions.map((prescription, index) => (
            <div key={index} className="border-l-4 border-purple-200 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">{prescription.medication}</h4>
              <p className="text-sm text-gray-600">
                {prescription.dosage} - {prescription.frequency} for {prescription.duration}
              </p>
              {prescription.instructions && (
                <p className="text-sm text-gray-500 mt-1">{prescription.instructions}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Billing Codes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-orange-700 mb-4">Billing Codes</h3>
        <div className="space-y-2">
          {data.billingCodes.map((code, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <span className="font-mono text-sm font-semibold text-gray-900">{code.code}</span>
              <span className="text-sm text-gray-600 flex-1 ml-4">{code.description}</span>
              {code.units && (
                <span className="text-sm text-gray-500">Units: {code.units}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Instructions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-red-700 mb-3">Follow-up Instructions</h3>
        <p className="text-gray-700 text-sm leading-relaxed">{data.followUpInstructions}</p>
      </div>

      {/* Approve & Sign Button */}
      <div className="flex justify-center pt-6">
        <Button 
          size="lg" 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
        >
          Approve & Sign
        </Button>
      </div>
    </div>
  );
}
