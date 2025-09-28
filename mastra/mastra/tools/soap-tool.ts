import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const soapTool = createTool({
  id: 'generate-soap-note',
  description: 'Generate structured medical data from a patient visit transcript',
  inputSchema: z.object({
    transcript: z.string().describe('Patient visit transcript or dictation'),
  }),
  outputSchema: z.object({
    transcription: z.string().describe('Original transcript'),
    soap_note: z.string().describe('Generated SOAP note in standard medical format'),
    diagnosis: z.string().describe('Primary diagnosis extracted from transcript'),
    billing_code: z.object({
      code: z.string(),
      description: z.string(),
    }).describe('ICD-10 billing code for the diagnosis'),
    prescriptions: z.array(z.object({
      medication: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
    })).describe('Prescriptions mentioned in transcript'),
    lab_orders: z.array(z.string()).describe('Lab orders mentioned in transcript'),
  }),
  execute: async ({ context }) => {
    return await processTranscript(context.transcript);
  },
});

const processTranscript = async (transcript: string) => {
  // Extract medical information from the transcript
  const diagnosis = extractDiagnosis(transcript);
  const prescriptions = extractPrescriptions(transcript);
  const labOrders = extractLabOrders(transcript);
  const billingCode = getBillingCodeForDiagnosis(diagnosis);
  
  // Generate SOAP note
  const soapNote = generateSOAPNote(transcript, diagnosis, prescriptions, labOrders);
  
  // Return structured medical data matching frontend expectations
  return {
    transcription: transcript,
    soap_note: soapNote,
    diagnosis: diagnosis || "Not entered",
    billing_code: billingCode,
    prescriptions: prescriptions.length > 0 ? prescriptions : [{
      medication: "Not entered",
      dosage: "Not entered", 
      frequency: "Not entered",
      duration: "Not entered"
    }],
    lab_orders: labOrders.length > 0 ? labOrders : ["Not entered"],
  };
};

const extractDiagnosis = (transcript: string): string => {
  const lowerTranscript = transcript.toLowerCase();
  
  // Enhanced pattern matching for common diagnoses
  const diagnosisPatterns = [
    { pattern: /diagnosis[:\s]+([^.]+)/i, priority: 1 },
    { pattern: /diagnosed with ([^.]+)/i, priority: 1 },
    { pattern: /condition[:\s]+([^.]+)/i, priority: 2 },
    { pattern: /assessment[:\s]+([^.]+)/i, priority: 1 },
  ];
  
  // Try explicit patterns first
  for (const { pattern } of diagnosisPatterns.sort((a, b) => a.priority - b.priority)) {
    const match = transcript.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Medical condition detection based on keywords
  if (lowerTranscript.includes('urinary') && (lowerTranscript.includes('infection') || lowerTranscript.includes('uti') || lowerTranscript.includes('nitrites'))) {
    return 'urinary tract infection';
  }
  if (lowerTranscript.includes('hypertension') || lowerTranscript.includes('high blood pressure')) {
    return 'hypertension';
  }
  if (lowerTranscript.includes('diabetes')) {
    return 'diabetes mellitus';
  }
  if (lowerTranscript.includes('strep') || (lowerTranscript.includes('sore throat') && lowerTranscript.includes('positive'))) {
    return 'streptococcal pharyngitis';
  }
  if (lowerTranscript.includes('sore throat') || lowerTranscript.includes('pharyngitis')) {
    return 'pharyngitis';
  }
  if (lowerTranscript.includes('pneumonia')) {
    return 'pneumonia';
  }
  if (lowerTranscript.includes('bronchitis')) {
    return 'bronchitis';
  }
  
  return 'unspecified condition';
};

const extractPrescriptions = (transcript: string) => {
  const prescriptions = [];
  const lowerTranscript = transcript.toLowerCase();
  
  // Enhanced medication extraction patterns
  const medicationPatterns = [
    // Pattern: "prescribing nitrofurantoin 100mg twice daily for 5 days"
    /(?:prescrib|start|give|take)\w*\s+([a-z]+(?:cillin|mycin|furantoin|pril|olol|ide|ine|ate|one))\s*(\d+\s*mg)?\s*(?:,?\s*)?([^.]*)/gi,
    // Pattern: "amoxicillin 500mg twice daily for 10 days"
    /([a-z]+(?:cillin|mycin|furantoin|pril|olol|ide|ine|ate|one))\s+(\d+\s*mg)\s+(twice|once|three times|bid|tid|qid)?\s*(daily|a day|per day)?(?:\s+for\s+(\d+\s+days?))?/gi,
    // Pattern: "nitrofurantoin ordering"
    /(nitrofurantoin|amoxicillin|lisinopril|metformin|atorvastatin|ibuprofen|acetaminophen)/gi,
  ];
  
  const foundMedications = new Set();
  
  for (const pattern of medicationPatterns) {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      const medication = match[1]?.toLowerCase() || '';
      if (medication && !foundMedications.has(medication)) {
        foundMedications.add(medication);
        
        // Extract or infer dosage, frequency, duration
        let dosage = match[2] || getDefaultDosage(medication);
        let frequency = match[3] || getDefaultFrequency(medication);
        let duration = match[5] || getDefaultDuration(medication);
        
        // Clean up frequency
        if (frequency && !frequency.includes('daily') && !frequency.includes('day')) {
          frequency = frequency + ' daily';
        }
        
        prescriptions.push({
          medication: capitalizeFirst(medication),
          dosage: dosage || 'Not entered',
          frequency: frequency || 'Not entered',
          duration: duration || 'Not entered',
        });
      }
    }
  }
  
  return prescriptions;
};

const getDefaultDosage = (medication: string): string => {
  const defaults: Record<string, string> = {
    'nitrofurantoin': '100mg',
    'amoxicillin': '500mg',
    'lisinopril': '10mg',
    'metformin': '500mg',
    'atorvastatin': '20mg',
  };
  return defaults[medication.toLowerCase()] || 'Not entered';
};

const getDefaultFrequency = (medication: string): string => {
  const defaults: Record<string, string> = {
    'nitrofurantoin': 'twice daily',
    'amoxicillin': 'twice daily',
    'lisinopril': 'once daily',
    'metformin': 'twice daily',
    'atorvastatin': 'once daily',
  };
  return defaults[medication.toLowerCase()] || 'Not entered';
};

const getDefaultDuration = (medication: string): string => {
  const defaults: Record<string, string> = {
    'nitrofurantoin': '5 days',
    'amoxicillin': '10 days',
    'lisinopril': 'ongoing',
    'metformin': 'ongoing',
    'atorvastatin': 'ongoing',
  };
  return defaults[medication.toLowerCase()] || 'Not entered';
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const extractLabOrders = (transcript: string): string[] => {
  const labOrders = [];
  const lowerTranscript = transcript.toLowerCase();
  
  // Enhanced lab order patterns
  const labPatterns = [
    /(?:order|ordering)\s+(.*?(?:culture|test|lab|analysis|panel|screen))/gi,
    /(?:lab|test|culture|analysis)\s+([^.]+)/gi,
    /(?:blood work|labs?|testing)\s+([^.]+)/gi,
    /(urine culture|blood culture|throat culture|wound culture)/gi,
    /(cbc|bmp|cmp|lipid panel|hba1c|urinalysis|ua|ekg|ecg|chest x-ray|xray)/gi,
  ];
  
  const foundLabs = new Set();
  
  for (const pattern of labPatterns) {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      let labOrder = match[1]?.trim() || match[0]?.trim();
      if (labOrder && labOrder.length > 2 && !foundLabs.has(labOrder.toLowerCase())) {
        foundLabs.add(labOrder.toLowerCase());
        // Clean up the lab order
        labOrder = labOrder.replace(/^(a|an|the)\s+/i, '');
        labOrders.push(capitalizeFirst(labOrder));
      }
    }
  }
  
  // Check for common lab orders based on diagnosis context
  if (lowerTranscript.includes('urinary') || lowerTranscript.includes('uti')) {
    if (!foundLabs.has('urine culture')) {
      labOrders.push('Urine culture');
    }
    if (!foundLabs.has('urinalysis')) {
      labOrders.push('Urinalysis');
    }
  }
  
  if (lowerTranscript.includes('strep') || lowerTranscript.includes('throat')) {
    if (!foundLabs.has('throat culture')) {
      labOrders.push('Throat culture');
    }
  }
  
  return labOrders;
};

const getBillingCodeForDiagnosis = (diagnosis: string): { code: string; description: string } => {
  const lowerDiagnosis = diagnosis.toLowerCase();
  
  // Common ICD-10 codes
  const billingCodes: Record<string, { code: string; description: string }> = {
    'urinary tract infection': { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
    'uti': { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
    'hypertension': { code: 'I10', description: 'Essential hypertension' },
    'diabetes mellitus': { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    'diabetes': { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    'streptococcal pharyngitis': { code: 'J02.0', description: 'Streptococcal pharyngitis' },
    'pharyngitis': { code: 'J02.9', description: 'Acute pharyngitis, unspecified' },
    'sore throat': { code: 'J02.9', description: 'Acute pharyngitis, unspecified' },
    'pneumonia': { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
    'bronchitis': { code: 'J40', description: 'Bronchitis, not specified as acute or chronic' },
    'upper respiratory infection': { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
    'headache': { code: 'R51', description: 'Headache' },
    'fever': { code: 'R50.9', description: 'Fever, unspecified' },
  };
  
  // Try exact match first
  for (const [condition, code] of Object.entries(billingCodes)) {
    if (lowerDiagnosis.includes(condition)) {
      return code;
    }
  }
  
  // Default fallback
  return { code: 'R69', description: 'Illness, unspecified' };
};

const generateSOAPNote = (transcript: string, diagnosis: string, prescriptions: any[], labOrders: string[]): string => {
  // Extract key information for SOAP sections
  const subjective = extractSubjective(transcript);
  const objective = extractObjective(transcript);
  const assessment = diagnosis;
  const plan = generatePlan(prescriptions, labOrders);
  
  return `
SUBJECTIVE:
${subjective}

OBJECTIVE:
${objective}

ASSESSMENT:
${assessment}

PLAN:
${plan}
`.trim();
};

const extractSubjective = (transcript: string): string => {
  // Extract patient-reported symptoms and complaints
  const subjectiveKeywords = ['complains', 'reports', 'states', 'says', 'mentions', 'describes'];
  const sentences = transcript.split(/[.!?]+/);
  
  const subjectiveInfo = sentences
    .filter(sentence => 
      subjectiveKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    )
    .join('. ');
  
  return subjectiveInfo || `Patient presents with concerns as described in transcript: ${transcript.substring(0, 100)}...`;
};

const extractObjective = (transcript: string): string => {
  // Extract vital signs and examination findings
  const vitals = [];
  const examFindings = [];
  
  // Look for vital signs
  const bpMatch = transcript.match(/(?:BP|blood pressure)[:\s]*(\d+\/\d+)/i);
  if (bpMatch) vitals.push(`BP ${bpMatch[1]}`);
  
  const tempMatch = transcript.match(/(?:temp|temperature)[:\s]*(\d+\.?\d*)/i);
  if (tempMatch) vitals.push(`Temp ${tempMatch[1]}°F`);
  
  const hrMatch = transcript.match(/(?:HR|heart rate)[:\s]*(\d+)/i);
  if (hrMatch) vitals.push(`HR ${hrMatch[1]}`);
  
  // Look for exam findings
  if (transcript.toLowerCase().includes('clear')) examFindings.push('Lungs clear to auscultation');
  if (transcript.toLowerCase().includes('erythematous')) examFindings.push('Pharynx erythematous');
  if (transcript.toLowerCase().includes('exudates')) examFindings.push('Tonsillar exudates present');
  
  const vitalsText = vitals.length > 0 ? `Vitals: ${vitals.join(', ')}.` : '';
  const examText = examFindings.length > 0 ? `Physical Exam: ${examFindings.join('. ')}.` : '';
  
  return [vitalsText, examText].filter(Boolean).join('\n') || 'Physical examination findings as noted in transcript.';
};

const generatePlan = (prescriptions: any[], labOrders: string[]): string => {
  const planItems = [];
  
  // Add prescriptions
  prescriptions.forEach(rx => {
    planItems.push(`- Prescribe ${rx.medication} ${rx.dosage}, ${rx.frequency} for ${rx.duration}`);
  });
  
  // Add lab orders
  labOrders.forEach(lab => {
    planItems.push(`- Order ${lab}`);
  });
  
  // Add default follow-up
  planItems.push('- Follow up as needed');
  planItems.push('- Return if symptoms worsen');
  
  return planItems.join('\n');
};
