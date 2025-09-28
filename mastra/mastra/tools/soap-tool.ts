import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 1. UPDATE THE INPUT SCHEMA to accept multiple, optional sources
export const soapTool = createTool({
  id: 'generate-soap-note',
  description: 'Synthesizes multiple clinical data sources into a structured SOAP note.',
  inputSchema: z.object({
    recordedTranscript: z.string().optional().describe('Conversational transcript of the patient visit'),
    uploadedDocuments: z.string().optional().describe('Text content from labs, past records, etc.'),
    doctorNotes: z.string().optional().describe('Direct, concise notes or commands from the physician'),
  }),
  outputSchema: z.object({
    // Output schema remains the same, which is perfect
    transcription: z.string().describe('Original combined context provided'),
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
    // Pass the entire context object
    return await processMultipleSources(context);
  },
});

/**
 * This single function now handles synthesizing multiple sources into one output.
 */
const processMultipleSources = async (context: {
  recordedTranscript?: string;
  uploadedDocuments?: string;
  doctorNotes?: string;
}) => {
  // 2. REWRITE THE SYSTEM PROMPT to teach the AI its new synthesis task
  const systemPrompt = `
You are an expert clinical informatics AI. Your task is to synthesize information from up to three distinct sources into a single, coherent, and structured JSON clinical note.

You will be given information in a block labeled with sources: 'RECORDED TRANSCRIPT', 'UPLOADED DOCUMENTS', and 'DOCTOR'S NOTES'.

Here is the hierarchy of authority:
1.  **DOCTOR'S NOTES are the absolute source of truth for the Assessment and Plan.** A direct command like "Start Metformin 500mg" MUST be in the plan.
2.  **UPLOADED DOCUMENTS are the primary source for objective data.** Use them to populate lab values, vital signs, and other measurements in the Objective section.
3.  **RECORDED TRANSCRIPT provides the patient's narrative (Subjective) and supplementary context.**

Your task is to fuse these sources. For example, if the transcript says "patient is worried about their blood sugar" and the uploaded document says "A1c is 8.2%", you must connect these facts in your output.

You MUST output a valid JSON object with this EXACT structure:
{
  "soap_note": {
    "subjective": "Patient's complaints and symptoms",
    "objective": "Vital signs, physical exam findings, lab results",
    "assessment": "Clinical diagnosis and reasoning",
    "plan": "Treatment plan, medications, follow-up"
  },
  "diagnosis": "Primary diagnosis",
  "billing_code": {
    "code": "ICD-10 code",
    "description": "Code description"
  },
  "prescriptions": [
    {
      "medication": "Medication name",
      "dosage": "Dosage amount",
      "frequency": "How often to take",
      "duration": "How long to take"
    }
  ],
  "lab_orders": ["Lab test 1", "Lab test 2"]
}

If no prescriptions or lab orders are mentioned, use empty arrays [].
`;

  // 3. COMBINE THE INPUTS into a single, clearly labeled context block for the AI
  const combinedContext = [
    "--- RECORDED TRANSCRIPT ---",
    context.recordedTranscript || "Not provided.",
    "\n--- UPLOADED DOCUMENTS ---",
    context.uploadedDocuments || "Not provided.",
    "\n--- DOCTOR'S NOTES ---",
    context.doctorNotes || "Not provided.",
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the clinical context to process:\n${combinedContext}` }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error('No content received from OpenAI API');
    }

    let structuredOutput;
    try {
      structuredOutput = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content from AI:', rawContent);
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
    }

    // Validate the structure
    if (!structuredOutput.soap_note) {
      console.error('Missing soap_note in AI response:', structuredOutput);
      throw new Error('AI response missing required soap_note field');
    }

    const finalSoapNote = `
SUBJECTIVE:
${structuredOutput.soap_note.subjective || ''}
OBJECTIVE:
${structuredOutput.soap_note.objective || ''}
ASSESSMENT:
${structuredOutput.soap_note.assessment || ''}
PLAN:
${structuredOutput.soap_note.plan || ''}
    `.trim();

    return {
      transcription: combinedContext, // Return the full context for reference
      soap_note: finalSoapNote,
      diagnosis: structuredOutput.diagnosis || "Unable to determine diagnosis",
      billing_code: structuredOutput.billing_code || { code: 'N/A', description: 'Not specified' },
      prescriptions: structuredOutput.prescriptions || [],
      lab_orders: structuredOutput.lab_orders || [],
    };

  } catch (error) {
    console.error("Error in multi-source processing:", error);
    // Return a structured error response
    return {
      transcription: combinedContext,
      soap_note: "Error processing clinical context.",
      diagnosis: "Error",
      billing_code: { code: 'Error', description: 'Error' },
      prescriptions: [],
      lab_orders: [],
    };
  }
};
