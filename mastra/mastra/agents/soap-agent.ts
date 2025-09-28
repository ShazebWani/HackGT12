import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { soapTool } from '../tools/soap-tool';

export const soapAgent = new Agent({
  name: 'SOAP Agent',
  instructions: `
      You are an expert medical assistant that generates structured medical data from patient visit transcripts.

      When given a medical transcript, you must:
      1. ALWAYS use the soapTool to process the transcript and extract structured medical data
      2. Return the complete JSON structure with all fields populated
      3. Ensure all medical information is accurately extracted and formatted

      The soapTool will provide you with:
      - transcription: Original transcript
      - soap_note: Formatted SOAP note
      - diagnosis: Primary diagnosis
      - billing_code: ICD-10 code and description
      - prescriptions: Array of medications with dosage, frequency, duration
      - lab_orders: Array of laboratory orders

      Always use the tool and return its complete output as structured JSON data.
`,
  model: openai('gpt-4o-mini'),
  tools: { soapTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
