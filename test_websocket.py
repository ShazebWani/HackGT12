#!/usr/bin/env python3
"""
WebSocket test script to demonstrate the real-time audio streaming functionality
"""

import asyncio
import websockets
import json
import time

async def test_websocket():
    """Test the WebSocket streaming endpoint"""
    uri = "ws://localhost:8000/ws/process-visit"
    
    try:
        print("Connecting to WebSocket...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket!")
            
            # Simulate sending audio chunks
            print("\n📡 Simulating audio streaming...")
            for i in range(3):
                # Send mock audio data
                audio_chunk = f"mock_audio_chunk_{i}".encode()
                await websocket.send(audio_chunk)
                print(f"Sent audio chunk {i+1}")
                
                # Wait a bit to simulate real-time streaming
                await asyncio.sleep(1)
            
            print("\n🎧 Listening for transcription updates...")
            
            # Listen for partial transcripts
            transcript_count = 0
            while transcript_count < 4:  # Expect 4 partial transcripts based on our mock
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(message)
                    
                    if data["type"] == "partial_transcript":
                        print(f"📝 Partial transcript: {data['text']}")
                        transcript_count += 1
                    elif data["type"] == "audio_received":
                        print(f"✅ Server acknowledged audio: {data['bytes_received']} bytes")
                        
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for transcript")
                    break
            
            # Signal end of stream
            print("\n🔚 Sending END_OF_STREAM signal...")
            await websocket.send("END_OF_STREAM")
            
            # Wait for final result
            print("⏳ Waiting for final structured result...")
            try:
                final_message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                final_data = json.loads(final_message)
                
                if final_data["type"] == "final_result":
                    print("\n🎉 Final structured result received!")
                    print("=" * 50)
                    result = final_data["data"]
                    print(f"📝 Diagnosis: {result['diagnosis']}")
                    print(f"🏥 Billing Code: {result['billing_code']['code']}")
                    print(f"💊 Prescription: {result['prescriptions'][0]['medication']} {result['prescriptions'][0]['dosage']}")
                    print(f"🧪 Lab Orders: {', '.join(result['lab_orders'])}")
                    print("=" * 50)
                else:
                    print(f"❌ Unexpected message type: {final_data['type']}")
                    
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for final result")
    
    except (ConnectionRefusedError, OSError):
        print("❌ Could not connect to WebSocket. Make sure the server is running on ws://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("🚀 Testing ScribeAgent AI WebSocket Streaming")
    print("=" * 50)
    asyncio.run(test_websocket())

if __name__ == "__main__":
    main()
