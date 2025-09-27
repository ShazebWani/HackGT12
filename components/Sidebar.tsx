import { Stethoscope, SidebarClose, User } from 'lucide-react'
import { usePatient } from '../contexts/PatientContext'

const Sidebar = () => {
  const { filteredPatients, activePatient, selectPatient } = usePatient();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <aside className="h-full w-64 bg-accent-1/50 flex flex-col">
      {/* Header */}
      <div className='flex justify-between items-center h-12 p-4 border-b border-white/20'>
        <div className="flex items-center gap-2">
          <Stethoscope className="text-white" />
          <span className="text-white/70 text-sm">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
          </span>
        </div>
        <SidebarClose className='size-5 hover:scale-110 transition-transform duration-150 text-white'/>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPatients.length === 0 ? (
          <div className="p-4 text-white/70 text-sm text-center">
            No patients found
          </div>
        ) : (
          <div className="p-2">
            {filteredPatients.map((patient) => {
              const isActive = activePatient?.id === patient.id;
              
              return (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient.id)}
                  className={`
                    w-full text-left p-3 rounded-lg mb-2 transition-all duration-200
                    ${isActive 
                      ? 'bg-white/20 border border-white/30 shadow-sm' 
                      : 'hover:bg-white/10 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <User className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/70'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-white/90'}`}>
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-white/60'}`}>
                        {patient.mrn} • {formatDate(patient.dateOfBirth)}
                      </div>
                      {patient.medicalData?.chiefComplaint && (
                        <div className={`text-xs mt-1 truncate ${isActive ? 'text-white/70' : 'text-white/50'}`}>
                          {patient.medicalData.chiefComplaint}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar