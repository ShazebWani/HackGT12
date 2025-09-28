#!/usr/bin/env python3
"""
Debug script to check PDF context extraction
"""
import requests
import json

def debug_multiple_files():
    """Debug multiple files processing to see context"""
    print("🔍 Debugging Multiple Files Context Extraction")
    print("=" * 60)
    
    # Create test files with distinct content
    files_content = [
        ("patient_history.txt", "PATIENT HISTORY:\n45-year-old male with diabetes and hypertension.\nMedications: Metformin, Lisinopril."),
        ("lab_results.txt", "LAB RESULTS:\nGlucose: 180 mg/dL (elevated)\nHbA1c: 8.2% (poor control)"),
        ("symptoms.txt", "CURRENT SYMPTOMS:\nPatient reports increased thirst and frequent urination.")
    ]
    
    # Create test files
    for filename, content in files_content:
        with open(filename, "w") as f:
            f.write(content)
        print(f"📝 Created {filename}")
    
    try:
        # Test multiple files processing
        with open("patient_history.txt", "rb") as f1, \
             open("lab_results.txt", "rb") as f2, \
             open("symptoms.txt", "rb") as f3:
            
            files = [
                ('files', ('patient_history.txt', f1, 'text/plain')),
                ('files', ('lab_results.txt', f2, 'text/plain')),
                ('files', ('symptoms.txt', f3, 'text/plain'))
            ]
            
            print("\n🚀 Sending request to backend...")
            response = requests.post('http://localhost:8000/api/process-multiple-files', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Request successful!")
            
            # Show the full transcription to see if file names are included
            transcription = result.get('transcription', '')
            print(f"\n📄 Full Transcription ({len(transcription)} characters):")
            print("-" * 60)
            print(transcription)
            print("-" * 60)
            
            # Check for file names in transcription
            file_names = ['patient_history.txt', 'lab_results.txt', 'symptoms.txt']
            print(f"\n🔍 Checking for file names in transcription:")
            for name in file_names:
                if name in transcription:
                    print(f"✅ Found: {name}")
                else:
                    print(f"❌ Missing: {name}")
            
            # Check for content markers
            content_markers = ['PATIENT HISTORY:', 'LAB RESULTS:', 'CURRENT SYMPTOMS:']
            print(f"\n🔍 Checking for content markers:")
            for marker in content_markers:
                if marker in transcription:
                    print(f"✅ Found: {marker}")
                else:
                    print(f"❌ Missing: {marker}")
            
            # Show SOAP note
            soap_note = result.get('soap_note', '')
            print(f"\n📋 SOAP Note Preview:")
            print("-" * 40)
            print(soap_note[:500] + "..." if len(soap_note) > 500 else soap_note)
            print("-" * 40)
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Cleanup
        import os
        for filename, _ in files_content:
            if os.path.exists(filename):
                os.remove(filename)
                print(f"🧹 Cleaned up {filename}")

if __name__ == "__main__":
    debug_multiple_files()
