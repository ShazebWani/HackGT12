import { useState } from 'react'
import { User, FileText, ChevronDown, ChevronUp, Calendar, Pill } from 'lucide-react'
import { usePatient } from '../contexts/PatientContext'
import { MedicalRecord, Prescription } from '../lib/types'

const PatientDisplayCard = () => {
  const { activePatient } = usePatient()
  const [showRecords, setShowRecords] = useState(false)
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null)

  if (!activePatient) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const toggleRecord = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId)
  }

  const togglePrescription = (prescriptionKey: string) => {
    setExpandedPrescription(expandedPrescription === prescriptionKey ? null : prescriptionKey)
  }

  return (
    <div className="medical-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-accent-1" />
        <h2 className="text-lg font-semibold text-accent-1">Current Patient</h2>
      </div>
      
      <div className="rounded-lg p-6 border-2 border-accent-1/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Patient Name
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {activePatient.firstName} {activePatient.lastName}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Date of Birth
            </label>
            <p className="text-lg text-gray-900">
              {formatDate(activePatient.dateOfBirth)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Medical Record Number
            </label>
            <p className="text-lg font-mono text-gray-900">
              {activePatient.mrn}
            </p>
          </div>
        </div>

        {/* Access Records Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowRecords(!showRecords)}
            className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-accent-1 transition-all duration-200 hover:bg-accent-1/5 px-3 py-2 rounded-lg"
          >
            <span className="font-medium">Access Records</span>
            {showRecords ? (
              <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        </div>

        {/* Medical Records Section */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showRecords 
            ? 'max-h-[2000px] opacity-100 mt-6 border-t border-gray-200 pt-6' 
            : 'max-h-0 opacity-0'
        }`}>
          <div className={`transition-transform duration-300 ${
            showRecords ? 'translate-y-0' : '-translate-y-4'
          }`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Records</h3>
            
            {activePatient.medicalRecords && activePatient.medicalRecords.length > 0 ? (
              <div className="space-y-4">
                {activePatient.medicalRecords.map((record: MedicalRecord) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-accent-1/30">
                    <div 
                      className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => toggleRecord(record.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-accent-1" />
                        <div>
                          <p className="font-medium text-gray-900">{record.diagnosis}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(record.date)}</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                        expandedRecord === record.id ? 'rotate-180' : 'rotate-0'
                      }`} />
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedRecord === record.id 
                        ? 'max-h-[1000px] opacity-100' 
                        : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
                        <div className="pt-4">
                          <h4 className="font-medium text-gray-900 mb-2">SOAP Note</h4>
                          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-line">
                            {record.soap_note}
                          </div>
                        </div>

                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Prescriptions</h4>
                            <div className="space-y-2">
                              {record.prescriptions.map((prescription: Prescription, index: number) => {
                                const prescriptionKey = `${record.id}-${index}`;
                                return (
                                  <div key={prescriptionKey} className="border border-gray-200 rounded overflow-hidden">
                                    <div 
                                      className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 transition-colors duration-200"
                                      onClick={() => togglePrescription(prescriptionKey)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Pill className="h-4 w-4 text-accent-1" />
                                        <span className="font-medium text-gray-900">{prescription.medication}</span>
                                      </div>
                                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                                        expandedPrescription === prescriptionKey ? 'rotate-180' : 'rotate-0'
                                      }`} />
                                    </div>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                      expandedPrescription === prescriptionKey 
                                        ? 'max-h-[200px] opacity-100' 
                                        : 'max-h-0 opacity-0'
                                    }`}>
                                      <div className="px-3 pb-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm pt-3">
                                        <div>
                                          <span className="text-gray-600">Dosage:</span>
                                          <span className="ml-2 text-gray-900">{prescription.dosage}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Frequency:</span>
                                          <span className="ml-2 text-gray-900">{prescription.frequency}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Duration:</span>
                                          <span className="ml-2 text-gray-900">{prescription.duration}</span>
                                        </div>
                                        {prescription.instructions && (
                                          <div className="col-span-2">
                                            <span className="text-gray-600">Instructions:</span>
                                            <span className="ml-2 text-gray-900">{prescription.instructions}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {record.lab_orders && record.lab_orders.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Lab Orders</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {record.lab_orders.map((order, index) => (
                                <li key={index}>{order}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No medical records found for this patient.</p>
                <p className="text-sm">Records will appear here after consultations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDisplayCard
