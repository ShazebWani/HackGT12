import { useState, useEffect } from 'react';
import { PatientService } from '../lib/patientService';
import { Patient } from '../lib/types';

export default function TestAPI() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        console.log('Loading patients...');
        console.log('Making direct fetch request...');
        
        // Test direct fetch first
        const response = await fetch('http://localhost:8000/api/patients');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API response:', data);
        
        // Convert to Patient format
        const patients = data.map((p: any) => ({
          id: p.id,
          mrn: p.mrn,
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          lastUpdated: p.last_updated,
          medicalData: p.medical_data
        }));
        
        console.log('Converted patients:', patients);
        setPatients(patients);
        setLoading(false);
      } catch (err) {
        console.error('Error loading patients:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    // Add a timeout to show if the call is hanging
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Request timed out after 10 seconds');
        setLoading(false);
      }
    }, 10000);

    loadPatients();

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return <div>Loading patients...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test - Patients</h1>
      <p className="mb-4">Found {patients.length} patients</p>
      <div className="space-y-4">
        {patients.map((patient) => (
          <div key={patient.id} className="border p-4 rounded">
            <h3 className="font-semibold">{patient.firstName} {patient.lastName}</h3>
            <p>MRN: {patient.mrn}</p>
            <p>DOB: {patient.dateOfBirth}</p>
            <p>Last Updated: {patient.lastUpdated}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
