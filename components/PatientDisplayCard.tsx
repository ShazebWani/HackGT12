import { User } from 'lucide-react'
import { usePatient } from '../contexts/PatientContext'

const PatientDisplayCard = () => {
  const { activePatient } = usePatient()

  if (!activePatient) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className="medical-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-accent-1" />
        <h2 className="text-lg font-semibold text-accent-1">Current Patient</h2>
      </div>
      
      <div className="bg-gradient-to-r from-accent-1/5 to-accent-1/10 rounded-lg p-6 border border-accent-1/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              Medical Record Number
            </label>
            <p className="text-lg font-mono text-gray-900">
              {activePatient.mrn}
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
              Age
            </label>
            <p className="text-lg text-gray-900">
              {calculateAge(activePatient.dateOfBirth)} years old
            </p>
          </div>
        </div>

        {activePatient.medicalData?.chiefComplaint && (
          <div className="mt-4 pt-4 border-t border-accent-1/20">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Chief Complaint
            </label>
            <p className="text-gray-900">
              {activePatient.medicalData.chiefComplaint}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-accent-1/20">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Last Updated
          </label>
          <p className="text-sm text-gray-500">
            {new Date(activePatient.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PatientDisplayCard
