#!/usr/bin/env python3
"""
Audio Test Script for ScribeAgent AI
This script simulates audio recording and WebSocket communication
"""

import asyncio
import websockets
import json
import time
import sys

async def test_websocket_audio():
    """Test WebSocket audio transcription functionality"""
    print("🎤 Testing WebSocket Audio Transcription...")
    
    try:
        # Connect to WebSocket
        uri = "ws://localhost:8000/ws/transcription"
        print(f"Connecting to {uri}...")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send a test message to simulate audio data
            test_message = {
                "type": "test_audio",
                "data": "This is a test audio message for transcription"
            }
            
            print("📤 Sending test message...")
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            print("⏳ Waiting for response...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(response)
                print("✅ Received response:")
                print(f"   Type: {data.get('type', 'Unknown')}")
                print(f"   Data: {data.get('data', 'No data')}")
                
            except asyncio.TimeoutError:
                print("⏰ No response received within 10 seconds")
            
            # Send END_OF_STREAM to close gracefully
            print("📤 Sending END_OF_STREAM...")
            await websocket.send(json.dumps({"type": "END_OF_STREAM"}))
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ WebSocket connection refused. Make sure the backend is running.")
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

async def test_audio_file_upload():
    """Test audio file upload functionality"""
    print("\n📁 Testing Audio File Upload...")
    
    try:
        import requests
        
        # Create a simple test audio file (this would normally be a real audio file)
        # For testing, we'll use a text file as a placeholder
        test_content = b"Test audio content for transcription"
        
        files = {"file": ("test_audio.wav", test_content, "audio/wav")}
        
        response = requests.post(
            "http://localhost:8000/api/process-visit",
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Audio file upload successful!")
            print(f"📋 Transcription: {data.get('transcription', 'Not found')[:100]}...")
            print(f"📋 Diagnosis: {data.get('diagnosis', 'Not found')}")
            print(f"💰 Billing Code: {data.get('billing_code', {}).get('code', 'Not found')}")
        else:
            print(f"❌ Audio file upload failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except ImportError:
        print("⚠️  requests library not available")
    except Exception as e:
        print(f"❌ Audio file upload test failed: {e}")

def test_manual_audio_instructions():
    """Provide instructions for manual audio testing"""
    print("\n🎧 Manual Audio Testing Instructions:")
    print("=" * 50)
    print("1. Open your browser and go to http://localhost:3002")
    print("2. Click on the 'Real-time Streaming' option")
    print("3. Click the record button and speak one of these test phrases:")
    print()
    print("   Test Phrase 1:")
    print("   'Patient is a 45-year-old male here for a follow-up on his hypertension. He says he's been taking his lisinopril 10mg daily and has been checking his blood pressure, which is running about 130 over 80. No complaints of dizziness or side effects. Physical exam shows blood pressure 128/82, heart rate 70, lungs clear. We'll continue the current lisinopril dose and see him back in 3 months.'")
    print()
    print("   Test Phrase 2:")
    print("   '55-year-old female with Type 2 diabetes presents for routine follow-up. She reports taking metformin 1000mg twice daily. Her last HbA1c was 7.5%. She's been experiencing increased thirst and urination. Physical exam reveals blood pressure 140/90. Blood glucose today is 185 mg/dL. We'll increase her metformin to 1000mg three times daily and add glipizide 5mg daily.'")
    print()
    print("4. Click stop and wait for the SOAP note to be generated")
    print("5. Verify that the results show:")
    print("   - Complete SOAP note with subjective, objective, assessment, plan")
    print("   - Proper diagnosis extraction")
    print("   - Correct billing codes")
    print("   - Prescriptions if mentioned")
    print("   - Lab orders if mentioned")

async def main():
    """Run all audio tests"""
    print("🎤 ScribeAgent AI - Audio Test Suite")
    print("=" * 50)
    
    # Test WebSocket connection
    await test_websocket_audio()
    
    # Test file upload
    await test_audio_file_upload()
    
    # Provide manual testing instructions
    test_manual_audio_instructions()
    
    print("\n" + "=" * 50)
    print("🎉 Audio test suite completed!")
    print("💡 For best results, test with actual audio recording through the web interface")

if __name__ == "__main__":
    asyncio.run(main())
