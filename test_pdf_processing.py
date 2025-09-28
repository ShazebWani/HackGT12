#!/usr/bin/env python3
"""
Test script to verify PDF processing and context extraction
"""
import requests
import json
import os

def test_pdf_processing():
    """Test PDF processing endpoint"""
    
    # Test with a sample PDF (you can replace this with your own PDF)
    pdf_path = "test_sample.pdf"
    
    # Create a simple test PDF if it doesn't exist
    if not os.path.exists(pdf_path):
        print("Creating a test PDF...")
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, "Patient Medical Report")
        c.drawString(100, 700, "Patient: John Doe")
        c.drawString(100, 650, "Date: 2024-01-15")
        c.drawString(100, 600, "Chief Complaint: Chest pain and shortness of breath")
        c.drawString(100, 550, "History: 45-year-old male with hypertension")
        c.drawString(100, 500, "Physical Exam: BP 140/90, HR 95, clear lungs")
        c.drawString(100, 450, "Assessment: Possible myocardial infarction")
        c.drawString(100, 400, "Plan: EKG, cardiac enzymes, aspirin 325mg")
        c.save()
        print(f"Created test PDF: {pdf_path}")
    
    # Test single PDF processing
    print("\n🧪 Testing single PDF processing...")
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': f}
            response = requests.post('http://localhost:8000/api/process-pdf', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Single PDF processing successful!")
            print(f"📄 Extracted text length: {len(result.get('transcription', ''))}")
            print(f"🔍 Diagnosis: {result.get('diagnosis', 'N/A')}")
            print(f"📋 SOAP Note preview: {result.get('soap_note', 'N/A')[:200]}...")
        else:
            print(f"❌ Single PDF processing failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing single PDF: {e}")
    
    # Test multiple files processing
    print("\n🧪 Testing multiple files processing...")
    try:
        # Create a test text file
        txt_path = "test_sample.txt"
        with open(txt_path, 'w') as f:
            f.write("Additional patient notes:\n")
            f.write("Patient reports feeling better after medication.\n")
            f.write("Follow-up scheduled for next week.\n")
        
        with open(pdf_path, 'rb') as pdf_file, open(txt_path, 'rb') as txt_file:
            files = [
                ('files', ('test_sample.pdf', pdf_file, 'application/pdf')),
                ('files', ('test_sample.txt', txt_file, 'text/plain'))
            ]
            response = requests.post('http://localhost:8000/api/process-multiple-files', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Multiple files processing successful!")
            print(f"📄 Combined text length: {len(result.get('transcription', ''))}")
            print(f"🔍 Diagnosis: {result.get('diagnosis', 'N/A')}")
            print(f"📋 SOAP Note preview: {result.get('soap_note', 'N/A')[:200]}...")
            
            # Check if both files are included in the transcription
            transcription = result.get('transcription', '')
            if 'test_sample.pdf' in transcription and 'test_sample.txt' in transcription:
                print("✅ Both files successfully combined in context!")
            else:
                print("⚠️ Files may not be properly combined")
        else:
            print(f"❌ Multiple files processing failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing multiple files: {e}")
    
    # Cleanup
    for file_path in [pdf_path, txt_path]:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🧹 Cleaned up {file_path}")

if __name__ == "__main__":
    test_pdf_processing()
