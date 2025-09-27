#!/usr/bin/env python3
"""
Test script for the streaming WebSocket endpoint
"""
import asyncio
import websockets
import json

async def test_websocket():
    """Test the WebSocket streaming endpoint"""
    uri = "ws://localhost:8000/ws/process-visit"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket")
            
            # Send some mock audio data (empty bytes for testing)
            mock_audio = b"mock_audio_data"
            await websocket.send(mock_audio)
            print("Sent mock audio data")
            
            # Listen for responses
            try:
                while True:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(response)
                    print(f"Received: {data}")
                    
                    if data.get("type") == "final_result":
                        print("Final result received, test complete")
                        break
                        
            except asyncio.TimeoutError:
                print("Timeout waiting for response")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing WebSocket streaming endpoint...")
    print("Make sure the server is running with: uvicorn main:app --reload")
    asyncio.run(test_websocket())
