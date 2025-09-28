import { FileText, Pill, TestTube, CreditCard, User, Check } from 'lucide-react'
import { useState } from 'react'

interface ResultsCardProps {
  results: {
    transcription?: string
    soap_note?: string
    diagnosis?: string
    billing_code?: {
      code?: string
      description?: string
    }
    prescriptions?: Array<{
      medication?: string
      dosage?: string
      frequency?: string
      duration?: string
    }>
    lab_orders?: string[]
  }
}

interface ResultsCardPropsExtended extends ResultsCardProps {
  // No additional props needed
}

export default function ResultsCard({ results }: ResultsCardPropsExtended) {
  const [isApproved, setIsApproved] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Editable state for all fields
  const [editableData, setEditableData] = useState({
    transcription: results?.transcription || '',
    soap_note: results?.soap_note || '',
    diagnosis: results?.diagnosis || '',
    billing_code: {
      code: results?.billing_code?.code || '',
      description: results?.billing_code?.description || ''
    },
    prescriptions: results?.prescriptions || [],
    lab_orders: results?.lab_orders || []
  });
  
  if (!results) {
    return null;
  }

  // Debug logging to see what data we're receiving
  console.log("🔍 ResultsCard received data:", results);
  console.log("🔍 Prescriptions data:", results.prescriptions);
  console.log("🔍 Lab orders data:", results.lab_orders);
  console.log("🔍 Prescriptions length:", results.prescriptions?.length);
  console.log("🔍 Lab orders length:", results.lab_orders?.length);

  const handleApproveAndSign = () => {
    setIsApproved(true);
    // Here you could also add API call to save the record to backend
    console.log("📝 Record approved and signed");
  };

  // Helper functions for updating editable data
  const updateField = (field: string, value: any) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
    // Reset approval state when any edit is made
    if (isApproved) setIsApproved(false);
  };

  const updateBillingCode = (field: string, value: string) => {
    setEditableData(prev => ({
      ...prev,
      billing_code: { ...prev.billing_code, [field]: value }
    }));
    // Reset approval state when any edit is made
    if (isApproved) setIsApproved(false);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    setEditableData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
    // Reset approval state when any edit is made
    if (isApproved) setIsApproved(false);
  };

  const updateLabOrder = (index: number, value: string) => {
    setEditableData(prev => ({
      ...prev,
      lab_orders: prev.lab_orders.map((order, i) => 
        i === index ? value : order
      )
    }));
    // Reset approval state when any edit is made
    if (isApproved) setIsApproved(false);
  };

  // Auto-resize textarea function
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  return (
    <div className="medical-card w-full mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-accent-1" />
        <h3 className="text-lg font-semibold text-accent-1">Medical Documentation</h3>
      </div>

      {/* Summary Cards */}
      <div className="p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={`border-2 rounded-lg p-6 transition-all ${
            editingField === 'diagnosis' ? 'border-accent-1 bg-accent-1/5' : 'border-accent-1/20'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-5 w-5 text-accent-1" />
              <h4 className="font-medium text-accent-1">Diagnosis</h4>
            </div>
            <input
              type="text"
              value={editableData.diagnosis || ''}
              onChange={(e) => updateField('diagnosis', e.target.value)}
              onFocus={() => setEditingField('diagnosis')}
              onBlur={() => setEditingField(null)}
              placeholder="Not specified"
              className="text-gray-800 capitalize bg-transparent border-none outline-none w-full p-0 transition-all"
            />
          </div>
          
          <div className={`border-2 rounded-lg p-6 transition-all ${
            editingField === 'billing' ? 'border-accent-1 bg-accent-1/5' : 'border-accent-1/20'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="h-5 w-5 text-accent-1" />
              <h4 className="font-medium text-accent-1">Billing Code</h4>
            </div>
            <input
              type="text"
              value={editableData.billing_code.code || ''}
              onChange={(e) => updateBillingCode('code', e.target.value)}
              onFocus={() => setEditingField('billing')}
              onBlur={() => setEditingField(null)}
              placeholder="Not specified"
              className="text-gray-800 font-mono bg-transparent border-none outline-none w-full p-0 transition-all"
            />
            <input
              type="text"
              value={editableData.billing_code.description || ''}
              onChange={(e) => updateBillingCode('description', e.target.value)}
              onFocus={() => setEditingField('billing')}
              onBlur={() => setEditingField(null)}
              placeholder="Not specified"
              className="text-gray-700 text-sm mt-1 bg-transparent border-none outline-none w-full p-0 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Full content sections */}
      <div className="space-y-6">
        {/* Transcription */}
        <div className={`rounded-lg p-6 border-2 transition-all ${
          editingField === 'transcription' ? 'border-accent-1 bg-accent-1/5' : 'border-transparent'
        }`}>
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">Original Transcription</h4>
          </div>
            <textarea
              value={editableData.transcription || ''}
              onChange={(e) => {
                updateField('transcription', e.target.value);
                autoResize(e.target);
              }}
              onFocus={(e) => {
                setEditingField('transcription');
                autoResize(e.target);
              }}
              onBlur={() => setEditingField(null)}
              placeholder="Not specified"
              className="border-2 border-accent-1/20 rounded-lg p-4 text-gray-700 italic leading-relaxed w-full bg-transparent outline-none transition-all resize-none overflow-hidden"
              style={{ minHeight: '100px' }}
            />
        </div>

        {/* SOAP Note */}
        <div className={`rounded-lg p-6 border-2 transition-all ${
          editingField === 'soap_note' ? 'border-accent-1 bg-accent-1/5' : 'border-transparent'
        }`}>
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">SOAP Note</h4>
          </div>
            <textarea
              value={editableData.soap_note || ''}
              onChange={(e) => {
                updateField('soap_note', e.target.value);
                autoResize(e.target);
              }}
              onFocus={(e) => {
                setEditingField('soap_note');
                autoResize(e.target);
              }}
              onBlur={() => setEditingField(null)}
              placeholder="Not specified"
              className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans border-2 border-accent-1/20 p-4 rounded-lg w-full bg-transparent outline-none transition-all resize-none overflow-hidden"
              style={{ minHeight: '200px' }}
            />
        </div>

        {/* Prescriptions */}
        <div className={`rounded-lg p-6 border-2 transition-all ${
          editingField === 'prescriptions' ? 'border-accent-1 bg-accent-1/5' : 'border-transparent'
        }`}>
          <div className="flex items-center space-x-2 mb-4">
            <Pill className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">Prescriptions</h4>
          </div>
          
          
          
          <div className="space-y-3">
            {editableData.prescriptions && editableData.prescriptions.length > 0 ? (
              editableData.prescriptions.map((prescription, index) => (
                  <div
                    key={index}
                    className="rounded-lg p-4 border-2 border-accent-1/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={prescription.medication || ''}
                        onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                        onFocus={() => setEditingField('prescriptions')}
                        onBlur={() => setEditingField(null)}
                        placeholder="Not specified"
                        className="font-semibold text-accent-1 text-lg bg-transparent border-none outline-none flex-1 p-0 transition-all"
                      />
                      <input
                        type="text"
                        value={prescription.dosage || ''}
                        onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                        onFocus={() => setEditingField('prescriptions')}
                        onBlur={() => setEditingField(null)}
                        placeholder="Not specified"
                        className="text-accent-2 font-medium bg-transparent border-none outline-none w-32 p-0 transition-all text-right"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={prescription.frequency || ''}
                        onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                        onFocus={() => setEditingField('prescriptions')}
                        onBlur={() => setEditingField(null)}
                        placeholder="Not specified"
                        className="text-gray-700 bg-transparent border-none outline-none flex-1 p-0 transition-all"
                      />
                      <span className="text-gray-700">for</span>
                      <input
                        type="text"
                        value={prescription.duration || ''}
                        onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                        onFocus={() => setEditingField('prescriptions')}
                        onBlur={() => setEditingField(null)}
                        placeholder="Not specified"
                        className="text-gray-700 bg-transparent border-none outline-none flex-1 p-0 transition-all"
                      />
                    </div>
                  </div>
              ))
            ) : (
              <div className="rounded-lg p-4 border-2 border-accent-1/20">
                <input
                  type="text"
                  value=""
                  onFocus={() => setEditingField('prescriptions')}
                  onBlur={() => setEditingField(null)}
                  placeholder="Not specified"
                  className="text-gray-800 font-medium bg-transparent border-none outline-none w-full p-0 transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Lab Orders */}
        <div className={`rounded-lg p-6 border-2 transition-all ${
          editingField === 'lab_orders' ? 'border-accent-1 bg-accent-1/5' : 'border-transparent'
        }`}>
          <div className="flex items-center space-x-2 mb-4">
            <TestTube className="h-6 w-6 text-accent-1" />
            <h4 className="text-lg font-semibold text-accent-1">Lab Orders</h4>
          </div>
          
          
          
          <div className="space-y-2">
            {editableData.lab_orders && editableData.lab_orders.length > 0 ? (
              editableData.lab_orders.map((order, index) => (
                  <div
                    key={index}
                    className="rounded-lg px-4 py-3 border-2 border-accent-1/20"
                  >
                    <input
                      type="text"
                      value={order || ''}
                      onChange={(e) => updateLabOrder(index, e.target.value)}
                      onFocus={() => setEditingField('lab_orders')}
                      onBlur={() => setEditingField(null)}
                      placeholder="Not specified"
                      className="text-gray-800 capitalize font-medium bg-transparent border-none outline-none w-full p-0 transition-all"
                    />
                  </div>
              ))
            ) : (
              <div className="rounded-lg px-4 py-3 border-2 border-accent-1/20">
                <input
                  type="text"
                  value=""
                  onFocus={() => setEditingField('lab_orders')}
                  onBlur={() => setEditingField(null)}
                  placeholder="Not specified"
                  className="text-gray-800 font-medium bg-transparent border-none outline-none w-full p-0 transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-accent-1/20">
          <button 
            onClick={handleApproveAndSign}
            disabled={isApproved}
            className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              isApproved 
                ? 'bg-accent-2 text-white cursor-default' 
                : 'bg-accent-1 hover:bg-accent-1/90 text-white hover:scale-[1.02]'
            }`}
          >
            {isApproved ? (
              <>
                <Check className="h-5 w-5" />
                Record Saved Successfully
              </>
            ) : (
              'Approve & Sign'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}