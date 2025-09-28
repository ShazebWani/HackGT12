import { User } from 'lucide-react'
import { usePatient } from '../contexts/PatientContext'

const PatientDisplayCard = () => {
  const { activePatient } = usePatient()

  if (!activePatient) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    })
  }

  return (
    <div className="medical-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-accent-1" />
        <h2 className="text-lg font-semibold text-accent-1">Current Patient</h2>
      </div>
      
      <div className="rounded-lg p-6 border-2 border-accent-1/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </div>
  )
}

export default PatientDisplayCard
