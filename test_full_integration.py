#!/usr/bin/env python3
"""
Test script for the complete audio to SOAP note integration
"""
import asyncio
import os
from dotenv import load_dotenv
from main import run_final_processing

# Load environment variables
load_dotenv()

async def test_full_integration():
    """Test the complete flow from transcript to SOAP note"""
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        print("Please set your OpenAI API key in a .env file or environment variable")
        print("You can get an API key from: https://platform.openai.com/api-keys")
        return
    
    # Import sample transcript from test fixtures
    from test_fixtures.sample_transcripts import get_sample_transcript
    test_transcript = get_sample_transcript("hypertension")
    
    print("🧪 Testing Complete Audio to SOAP Note Integration...")
    print(f"📝 Test transcript: {test_transcript.strip()}")
    print("\n" + "="*60)
    
    try:
        # Test the complete processing pipeline
        result = await run_final_processing(test_transcript)
        
        print("✅ Complete Integration Test Successful!")
        print("\n📋 Generated Medical Data:")
        print("-" * 40)
        
        # Display the structured medical data
        if 'transcription' in result:
            print(f"Transcription: {result['transcription'][:100]}...")
        
        if 'soap_note' in result:
            print(f"\nSOAP Note:\n{result['soap_note']}")
        
        if 'diagnosis' in result:
            print(f"\nDiagnosis: {result['diagnosis']}")
        
        if 'billing_code' in result:
            print(f"Billing Code: {result['billing_code']['code']} - {result['billing_code']['description']}")
        
        if 'prescriptions' in result:
            print(f"\nPrescriptions: {len(result['prescriptions'])} found")
            for i, rx in enumerate(result['prescriptions'], 1):
                print(f"  {i}. {rx['medication']} {rx['dosage']} {rx['frequency']} for {rx['duration']}")
        
        if 'lab_orders' in result:
            print(f"\nLab Orders: {result['lab_orders']}")
        
        print("-" * 40)
        print("🎉 Integration test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error in integration test: {e}")
        print("This might be due to:")
        print("1. Missing or invalid OPENAI_API_KEY")
        print("2. Network connectivity issues")
        print("3. SOAP agent configuration issues")

if __name__ == "__main__":
    asyncio.run(test_full_integration())
