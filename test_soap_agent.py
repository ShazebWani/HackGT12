#!/usr/bin/env python3
"""
Test script for the SOAP Note Generation Agent
"""
import asyncio
import os
from dotenv import load_dotenv
from agents.soap_agent import generate_soap_note

# Load environment variables
load_dotenv()

async def test_soap_agent():
    """Test the SOAP agent with a sample transcript"""
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        print("Please set your OpenAI API key in a .env file or environment variable")
        print("You can get an API key from: https://platform.openai.com/api-keys")
        return
    
    # Sample transcript for testing
    test_transcript = """
    Patient is a 45-year-old male here for a follow-up on his hypertension. 
    He says he's been taking his lisinopril daily and has been checking his blood pressure, 
    which is running about 130 over 80. No complaints of dizziness or side effects. 
    Exam shows a BP of 128/82 and a heart rate of 70. Lungs are clear. 
    We'll continue the current dose of lisinopril 10mg and see him back in 3 months.
    """
    
    print("🧪 Testing SOAP Note Generation Agent...")
    print(f"📝 Test transcript: {test_transcript.strip()}")
    print("\n" + "="*50)
    
    try:
        # Generate SOAP note
        soap_note = await generate_soap_note(test_transcript)
        
        print("✅ SOAP Note Generated Successfully!")
        print("\n📋 Generated SOAP Note:")
        print("-" * 30)
        print(soap_note)
        print("-" * 30)
        
    except Exception as e:
        print(f"❌ Error generating SOAP note: {e}")
        print("This might be due to:")
        print("1. Missing or invalid OPENAI_API_KEY")
        print("2. Network connectivity issues")
        print("3. Mastra library installation issues")

if __name__ == "__main__":
    asyncio.run(test_soap_agent())
