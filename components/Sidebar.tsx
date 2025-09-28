import { useState, useEffect } from 'react'
import { Stethoscope, SidebarClose, SidebarOpen, User, UserCircle, Plus } from 'lucide-react'
import { usePatient } from '../contexts/PatientContext'

const Sidebar = () => {
  const { filteredPatients, activePatient, selectPatient } = usePatient();
  
  // State for user info to avoid hydration issues
  const [userInfo, setUserInfo] = useState({ username: 'Unknown', role: 'Unknown' });
  const [isClient, setIsClient] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Get user info from localStorage on client side only
  useEffect(() => {
    setIsClient(true);
    
    try {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const user = JSON.parse(auth);
        setUserInfo({
          username: user.username || 'Unknown',
          role: user.role || 'Unknown'
        });
      }
    } catch (e) {
      console.error('Error parsing auth:', e);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCreateNewPatient = () => {
    // Deselect current patient to show the search/create form
    selectPatient('');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`h-full bg-accent-1/50 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center h-12 border-b border-white/20 px-3">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 hover:scale-110 transition-all duration-300 text-white group min-w-0"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
        >
          <div className="flex-shrink-0">
            {isCollapsed && isLogoHovered ? (
              <SidebarOpen className='size-6' />
            ) : (
              <Stethoscope className="size-6" />
            )}
          </div>
          {!isCollapsed && (
            <span className="text-white/70 text-sm whitespace-nowrap overflow-hidden">
              {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="ml-auto hover:scale-110 transition-transform duration-150 text-white flex-shrink-0"
          >
            <SidebarClose className='size-5' />
          </button>
        )}
      </div>

      {/* Tabs Section */}
      <div className="border-b border-white/20 px-3 py-3">
        {/* Status Tab */}
        <div className="mb-3">
          <div className="flex items-center gap-3 min-w-0 h-12">
            <div className="flex-shrink-0 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-white/80" />
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-white/90 text-xs font-medium truncate">{userInfo.username}</div>
                  <div className="text-white/60 text-xs capitalize">{userInfo.role}</div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${userInfo.role === 'doctor' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
              </>
            )}
          </div>
        </div>

        {/* Create New Patient Tab - Only show for doctors after client hydration */}
        {isClient && userInfo.role === 'doctor' && (
          <button
            onClick={handleCreateNewPatient}
            className="w-full flex items-center gap-3 hover:bg-white/20 rounded-lg transition-colors duration-200 min-w-0 h-12"
            title={isCollapsed ? "Create New Patient" : undefined}
          >
            <div className="flex-shrink-0 flex items-center justify-center">
              <Plus className="h-6 w-6 text-white/80" />
            </div>
            {!isCollapsed && (
              <span className="text-white/90 text-xs font-medium truncate flex items-center">Create New Patient</span>
            )}
          </button>
        )}
      </div>

      {/* Patient List - Only show when not collapsed */}
      {!isCollapsed && (
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
                      w-full text-left p-3 rounded-lg mb-2 transition-all duration-75
                      ${isActive 
                        ? 'bg-white/20' 
                        : 'hover:bg-white/10'
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
      )}
    </aside>
  )
}

export default Sidebar