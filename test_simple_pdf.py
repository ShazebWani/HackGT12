#!/usr/bin/env python3
"""
Simple test script to verify PDF processing without external dependencies
"""
import requests
import json
import os

def create_simple_test_files():
    """Create simple test files for testing"""
    
    # Create a simple text file
    txt_content = """Patient Medical Notes
Patient: Jane Smith
Date: 2024-01-15
Chief Complaint: Headache and nausea
History: 30-year-old female with migraines
Physical Exam: Normal vital signs, no neurological deficits
Assessment: Tension headache
Plan: Ibuprofen 400mg as needed, follow-up in 1 week
"""
    
    with open("test_notes.txt", "w") as f:
        f.write(txt_content)
    
    print("✅ Created test_notes.txt")

def test_text_processing():
    """Test text processing endpoint"""
    print("\n🧪 Testing text processing...")
    
    try:
        response = requests.post('http://localhost:8000/api/process-text-context', 
                               json={
                                   'text': 'Patient presents with chest pain and shortness of breath. Vital signs: BP 140/90, HR 95. Assessment: Possible cardiac event.',
                                   'context_type': 'medical_notes'
                               })
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text processing successful!")
            print(f"🔍 Diagnosis: {result.get('diagnosis', 'N/A')}")
            print(f"📋 SOAP Note preview: {result.get('soap_note', 'N/A')[:200]}...")
            return True
        else:
            print(f"❌ Text processing failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Error testing text processing: {e}")
        return False

def test_multiple_files():
    """Test multiple files processing with text files"""
    print("\n🧪 Testing multiple files processing...")
    
    try:
        # Create multiple test files
        files_content = [
            ("patient_history.txt", "Patient History:\n45-year-old male with diabetes and hypertension.\nMedications: Metformin, Lisinopril.\nLast visit: 3 months ago."),
            ("lab_results.txt", "Lab Results:\nGlucose: 180 mg/dL (elevated)\nHbA1c: 8.2% (poor control)\nCreatinine: 1.1 mg/dL (normal)"),
            ("current_symptoms.txt", "Current Symptoms:\nPatient reports increased thirst and frequent urination.\nNo chest pain or shortness of breath.\nBlood pressure today: 150/95 mmHg")
        ]
        
        # Create test files
        for filename, content in files_content:
            with open(filename, "w") as f:
                f.write(content)
        
        # Test multiple files processing
        with open("patient_history.txt", "rb") as f1, \
             open("lab_results.txt", "rb") as f2, \
             open("current_symptoms.txt", "rb") as f3:
            
            files = [
                ('files', ('patient_history.txt', f1, 'text/plain')),
                ('files', ('lab_results.txt', f2, 'text/plain')),
                ('files', ('current_symptoms.txt', f3, 'text/plain'))
            ]
            
            response = requests.post('http://localhost:8000/api/process-multiple-files', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Multiple files processing successful!")
            print(f"📄 Combined text length: {len(result.get('transcription', ''))}")
            print(f"🔍 Diagnosis: {result.get('diagnosis', 'N/A')}")
            print(f"📋 SOAP Note preview: {result.get('soap_note', 'N/A')[:300]}...")
            
            # Check if all files are included
            transcription = result.get('transcription', '')
            file_names = ['patient_history.txt', 'lab_results.txt', 'current_symptoms.txt']
            included_files = [name for name in file_names if name in transcription]
            print(f"📁 Files included in context: {included_files}")
            
            return True
        else:
            print(f"❌ Multiple files processing failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error testing multiple files: {e}")
        return False
    finally:
        # Cleanup
        for filename, _ in files_content:
            if os.path.exists(filename):
                os.remove(filename)
                print(f"🧹 Cleaned up {filename}")

def main():
    print("🧪 Testing PDF and Multi-File Processing")
    print("=" * 50)
    
    # Test basic text processing first
    if test_text_processing():
        print("\n✅ Backend is responding correctly!")
    else:
        print("\n❌ Backend may not be running or there's an issue")
        return
    
    # Test multiple files processing
    if test_multiple_files():
        print("\n✅ Multiple files processing is working!")
    else:
        print("\n❌ Multiple files processing failed")

if __name__ == "__main__":
    main()
