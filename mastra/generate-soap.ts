#!/usr/bin/env tsx

import { config } from 'dotenv';
import { soapAgent } from './mastra/agents/soap-agent';

// Load environment variables from .env file
config({ path: '../.env' }); // Load from parent directory
config(); // Also try current directory

async function generateSOAPNote(transcript: string) {
  try {
    // Use the SOAP agent to generate structured medical data
    const response = await soapAgent.generate([
      {
        role: 'user',
        content: `Please use the soapTool to process this medical transcript and return the complete structured medical data: ${transcript}`
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
  
  if (!transcript) {
    console.error('Usage: tsx generate-soap.ts "medical transcript here"');
    process.exit(1);
  }
  
  try {
    const soapNote = await generateSOAPNote(transcript);
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
