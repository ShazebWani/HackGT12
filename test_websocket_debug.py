#!/usr/bin/env python3
"""
Test script to debug WebSocket data flow
"""
import asyncio
import json
from main import run_final_processing

async def test_websocket_data():
    """Test what data would be sent via WebSocket"""
    
    # Import sample transcript from test fixtures
    from test_fixtures.sample_transcripts import get_sample_transcript
    test_transcript = get_sample_transcript("hypertension")
    
    print("🧪 Testing WebSocket data flow...")
    print(f"📝 Test transcript: {test_transcript.strip()}")
    print("\n" + "="*60)
    
    try:
        # Run the same processing that happens in WebSocket
        medical_data = await run_final_processing(test_transcript)
        
        print("✅ Processing successful!")
        print("\n📋 Medical data structure:")
        print(f"  Type: {type(medical_data)}")
        print(f"  Keys: {list(medical_data.keys()) if isinstance(medical_data, dict) else 'Not a dict'}")
        
        print(f"\n📋 Prescriptions:")
        prescriptions = medical_data.get('prescriptions', [])
        print(f"  Type: {type(prescriptions)}")
        print(f"  Length: {len(prescriptions) if isinstance(prescriptions, list) else 'Not a list'}")
        for i, rx in enumerate(prescriptions):
            print(f"  {i+1}. {rx}")
        
        print(f"\n📋 Lab orders:")
        lab_orders = medical_data.get('lab_orders', [])
        print(f"  Type: {type(lab_orders)}")
        print(f"  Length: {len(lab_orders) if isinstance(lab_orders, list) else 'Not a list'}")
        for i, order in enumerate(lab_orders):
            print(f"  {i+1}. {order}")
        
        # Simulate what would be sent via WebSocket
        websocket_message = {
            "type": "final_result",
            "data": medical_data,
            "is_final": True
        }
        
        print(f"\n📋 WebSocket message structure:")
        print(f"  Type: {type(websocket_message)}")
        print(f"  Data type: {type(websocket_message['data'])}")
        print(f"  Data keys: {list(websocket_message['data'].keys()) if isinstance(websocket_message['data'], dict) else 'Not a dict'}")
        
        # Test JSON serialization (what actually gets sent)
        try:
            json_str = json.dumps(websocket_message)
            print(f"\n✅ JSON serialization successful")
            print(f"  JSON length: {len(json_str)} characters")
            
            # Test deserialization (what frontend receives)
            parsed = json.loads(json_str)
            print(f"✅ JSON deserialization successful")
            print(f"  Parsed data keys: {list(parsed['data'].keys()) if isinstance(parsed['data'], dict) else 'Not a dict'}")
            print(f"  Parsed prescriptions: {parsed['data'].get('prescriptions', 'NOT FOUND')}")
            print(f"  Parsed lab_orders: {parsed['data'].get('lab_orders', 'NOT FOUND')}")
            
        except Exception as e:
            print(f"❌ JSON serialization failed: {e}")
        
    except Exception as e:
        print(f"❌ Error in processing: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_data())
