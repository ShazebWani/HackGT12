#!/usr/bin/env tsx

import { config } from 'dotenv';
import { soapAgent } from './mastra/agents/soap-agent';

// Load environment variables from .env file
config({ path: '../.env' }); // Load from parent directory
config(); // Also try current directory

async function generateSOAPNoteWithContext(
  recordedTranscript?: string, 
  uploadedDocuments?: string, 
  doctorNotes?: string
) {
  try {
    // Build the tool parameters object
    const toolParams: any = {};
    if (recordedTranscript && recordedTranscript.trim()) {
      toolParams.recordedTranscript = recordedTranscript;
    }
    if (uploadedDocuments && uploadedDocuments.trim()) {
      toolParams.uploadedDocuments = uploadedDocuments;
    }
    if (doctorNotes && doctorNotes.trim()) {
      toolParams.doctorNotes = doctorNotes;
    }

    // Create the prompt to use the tool with the structured parameters
    const prompt = `Please use the generate-soap-note tool with the following parameters: ${JSON.stringify(toolParams)}`;

    // Use the SOAP agent to generate structured medical data
    const response = await soapAgent.generate([
      {
        role: 'user',
        content: prompt
      }
    ]);

    // The agent should return the tool's JSON output
    // Try to parse the response as JSON first
    try {
      const jsonData = JSON.parse(response.text);
      return JSON.stringify(jsonData, null, 2);
    } catch (parseError) {
      console.error('❌ Failed to parse agent response as JSON:', parseError);
      console.error('❌ Raw response:', response.text);
      
      // Fallback: try to extract JSON from the response text
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          return JSON.stringify(extractedJson, null, 2);
        } catch {
          // Still couldn't parse, return original response
          return response.text;
        }
      }
      
      return response.text;
    }

  } catch (error) {
    console.error('❌ Error generating SOAP note:', error);
    throw error;
  }
}

// Handle command line usage
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments - support both old format and new structured format
  let recordedTranscript = '';
  let uploadedDocuments = '';
  let doctorNotes = '';
  
  // Check if we have the new structured arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--recordedTranscript' && i + 1 < args.length) {
      recordedTranscript = args[i + 1];
      i++; // Skip the next argument as it's the value
    } else if (args[i] === '--uploadedDocuments' && i + 1 < args.length) {
      uploadedDocuments = args[i + 1];
      i++; // Skip the next argument as it's the value
    } else if (args[i] === '--doctorNotes' && i + 1 < args.length) {
      doctorNotes = args[i + 1];
      i++; // Skip the next argument as it's the value
    } else if (!args[i].startsWith('--')) {
      // Legacy format - first non-flag argument is treated as transcript
      if (!recordedTranscript) {
        recordedTranscript = args[i];
      }
    }
  }
  
  // Check if we have any content
  if (!recordedTranscript && !uploadedDocuments && !doctorNotes) {
    console.error('Usage: tsx generate-soap.ts [--recordedTranscript "transcript"] [--uploadedDocuments "documents"] [--doctorNotes "notes"]');
    console.error('   OR: tsx generate-soap.ts "medical transcript here" [context_type] (legacy format)');
    process.exit(1);
  }
  
  try {
    let soapNote;
    if (recordedTranscript || uploadedDocuments || doctorNotes) {
      // Use the new structured format
      soapNote = await generateSOAPNoteWithContext(recordedTranscript, uploadedDocuments, doctorNotes);
    } else {
      // Fallback to legacy format
      soapNote = await generateSOAPNote(recordedTranscript, 'general');
    }
    
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
export { generateSOAPNote, generateSOAPNoteWithContext };

// Run if called directly
if (require.main === module) {
  main();
}
