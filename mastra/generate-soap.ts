#!/usr/bin/env tsx

import { config } from 'dotenv';
import { soapAgent } from './mastra/agents/soap-agent';

// Load environment variables from .env file
config({ path: '../.env' }); // Load from parent directory
config(); // Also try current directory

async function generateSOAPNote(transcript: string, contextType?: string) {
  try {
    // Enhance the prompt based on context type
    let enhancedPrompt = `Please use the soapTool to process this medical information and return the complete structured medical data: ${transcript}`;
    
    if (contextType) {
      switch (contextType.toLowerCase()) {
        case 'medical_notes':
          enhancedPrompt = `Please use the soapTool to process these medical notes and generate appropriate SOAP documentation, diagnoses, and treatment plans: ${transcript}`;
          break;
        case 'patient_history':
          enhancedPrompt = `Please use the soapTool to process this patient history information and generate relevant medical documentation: ${transcript}`;
          break;
        case 'symptoms':
          enhancedPrompt = `Please use the soapTool to process these patient symptoms and generate appropriate medical assessment and treatment plans: ${transcript}`;
          break;
        case 'lab_results':
          enhancedPrompt = `Please use the soapTool to process these lab results and generate appropriate medical interpretation and follow-up plans: ${transcript}`;
          break;
        default:
          enhancedPrompt = `Please use the soapTool to process this medical information and return the complete structured medical data: ${transcript}`;
      }
    }

    // Use the SOAP agent to generate structured medical data
    const response = await soapAgent.generate([
      {
        role: 'user',
        content: enhancedPrompt
      }
    ]);

    // Try to parse the response as JSON first
    try {
      const jsonData = JSON.parse(response.text);
      return JSON.stringify(jsonData, null, 2);
    } catch {
      // If not JSON, return the text response
      return response.text;
    }

  } catch (error) {
    console.error('❌ Error generating SOAP note:', error);
    throw error;
  }
}

// Handle command line usage
async function main() {
  const transcript = process.argv[2];
  const contextType = process.argv[3] || 'general';
  
  if (!transcript) {
    console.error('Usage: tsx generate-soap.ts "medical transcript here" [context_type]');
    process.exit(1);
  }
  
  try {
    const soapNote = await generateSOAPNote(transcript, contextType);
    console.log('\n📋 Generated SOAP Note:');
    console.log('='.repeat(50));
    console.log(soapNote);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Failed to generate SOAP note:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { generateSOAPNote };

// Run if called directly
if (require.main === module) {
  main();
}
