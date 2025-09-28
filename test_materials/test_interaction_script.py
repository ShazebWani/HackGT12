#!/usr/bin/env python3
"""
Test Interaction Script for ScribeAgent AI
This script tests the complete flow from text input to SOAP note generation
"""

import requests
import json
import time
import sys

# Configuration
API_BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3002"  # Note: using port 3002 as shown in terminal

def test_api_health():
    """Test if the API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is running")
            return True
        else:
            print(f"❌ Backend API returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend API is not accessible: {e}")
        return False

def test_text_processing():
    """Test text processing through the API"""
    test_cases = [
        {
            "name": "Hypertension Follow-up",
            "text": "Patient is a 45-year-old male here for a follow-up on his hypertension. He says he's been taking his lisinopril 10mg daily and has been checking his blood pressure, which is running about 130 over 80. No complaints of dizziness or side effects. Physical exam shows blood pressure 128/82, heart rate 70, lungs clear. We'll continue the current lisinopril dose and see him back in 3 months.",
            "context_type": "general"
        },
        {
            "name": "Diabetes Management",
            "text": "55-year-old female with Type 2 diabetes presents for routine follow-up. She reports taking metformin 1000mg twice daily and checking her blood sugar regularly. Her last HbA1c was 7.5%. She's been experiencing some increased thirst and urination over the past month. Physical exam reveals blood pressure 140/90, weight 180 pounds. Blood glucose today is 185 mg/dL. We'll increase her metformin to 1000mg three times daily and add glipizide 5mg daily.",
            "context_type": "medical_notes"
        },
        {
            "name": "Chest Pain Evaluation",
            "text": "62-year-old male presents with chest pain that started 2 hours ago. He describes it as pressure-like, 7/10 severity, radiating to left arm. Associated with diaphoresis and nausea. Past medical history significant for hypertension and smoking. Vital signs: BP 150/95, HR 88. EKG shows ST elevation in leads II, III, and aVF. Troponin elevated at 2.5. We're calling cardiology for immediate evaluation and starting aspirin 325mg, atorvastatin 80mg, and metoprolol 25mg twice daily.",
            "context_type": "general"
        }
    ]
    
    print("\n🧪 Testing Text Processing...")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i}: {test_case['name']} ---")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/process-text-context",
                json={
                    "text": test_case["text"],
                    "context_type": test_case["context_type"]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success!")
                print(f"📋 Diagnosis: {data.get('diagnosis', 'Not found')}")
                print(f"💰 Billing Code: {data.get('billing_code', {}).get('code', 'Not found')}")
                print(f"💊 Prescriptions: {len(data.get('prescriptions', []))} found")
                print(f"🔬 Lab Orders: {len(data.get('lab_orders', []))} found")
                
                # Show SOAP note preview
                soap_note = data.get('soap_note', '')
                if soap_note:
                    print("📝 SOAP Note Preview:")
                    print(soap_note[:200] + "..." if len(soap_note) > 200 else soap_note)
                
            else:
                print(f"❌ Failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        
        time.sleep(1)  # Brief pause between tests

def test_file_upload():
    """Test file upload functionality"""
    print("\n📁 Testing File Upload...")
    
    # Test with sample medical notes file
    try:
        with open("test_materials/sample_medical_notes.txt", "rb") as f:
            files = {"file": ("sample_medical_notes.txt", f, "text/plain")}
            response = requests.post(f"{API_BASE_URL}/api/process-pdf", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ File upload successful!")
            print(f"📋 Diagnosis: {data.get('diagnosis', 'Not found')}")
            print(f"💰 Billing Code: {data.get('billing_code', {}).get('code', 'Not found')}")
        else:
            print(f"❌ File upload failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except FileNotFoundError:
        print("❌ Test file not found. Please ensure test_materials/sample_medical_notes.txt exists.")
    except requests.exceptions.RequestException as e:
        print(f"❌ File upload request failed: {e}")

def test_websocket_connection():
    """Test WebSocket connection (basic check)"""
    print("\n🔌 Testing WebSocket Connection...")
    try:
        import websocket
        ws_url = f"ws://localhost:8000/ws/transcription"
        
        def on_open(ws):
            print("✅ WebSocket connection opened")
            ws.close()
        
        def on_error(ws, error):
            print(f"❌ WebSocket error: {error}")
        
        def on_close(ws, close_status_code, close_msg):
            print("✅ WebSocket connection closed")
        
        ws = websocket.WebSocketApp(ws_url, on_open=on_open, on_error=on_error, on_close=on_close)
        ws.run_forever(timeout=5)
        
    except ImportError:
        print("⚠️  websocket-client not installed. Install with: pip install websocket-client")
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

def main():
    """Run all tests"""
    print("🚀 ScribeAgent AI - Integration Test Suite")
    print("=" * 50)
    
    # Check if API is running
    if not test_api_health():
        print("\n❌ Backend API is not running. Please start it with:")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
        sys.exit(1)
    
    # Run tests
    test_text_processing()
    test_file_upload()
    test_websocket_connection()
    
    print("\n" + "=" * 50)
    print("🎉 Test suite completed!")
    print(f"🌐 Frontend should be available at: {FRONTEND_URL}")
    print("📝 Use the copy-paste notes in test_materials/copy_paste_notes.txt for manual testing")

if __name__ == "__main__":
    main()
