import { User } from 'lucide-react'

interface PatientInfoProps {
  patientName: string
  setPatientName: (name: string) => void
  patientDob: string
  setPatientDob: (dob: string) => void
}

const PatientInfoCard = ({ patientName, setPatientName, patientDob, setPatientDob }: PatientInfoProps) => {
  return (
    <div className="medical-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-accent-1" />
        <h2 className="text-lg font-semibold text-accent-1">Patient Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={patientDob}
            onChange={(e) => setPatientDob(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  )
}

export default PatientInfoCard