#!/usr/bin/env python3
"""
Test with real PDF files to verify context extraction
"""
import requests
import os

def test_with_real_pdfs():
    """Test with actual PDF files if they exist"""
    print("🧪 Testing with Real PDF Files")
    print("=" * 40)
    
    # Look for PDF files in the current directory
    pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]
    
    if not pdf_files:
        print("❌ No PDF files found in current directory")
        print("💡 To test with real PDFs:")
        print("   1. Place some PDF files in this directory")
        print("   2. Run this script again")
        print("   3. Or use the web interface at http://localhost:3003")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files: {pdf_files}")
    
    # Test each PDF individually
    for pdf_file in pdf_files[:3]:  # Test up to 3 PDFs
        print(f"\n🔍 Testing {pdf_file}...")
        try:
            with open(pdf_file, 'rb') as f:
                files = {'file': f}
                response = requests.post('http://localhost:8000/api/process-pdf', files=files)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {pdf_file} processed successfully!")
                print(f"📄 Text length: {len(result.get('transcription', ''))}")
                print(f"🔍 Diagnosis: {result.get('diagnosis', 'N/A')}")
                print(f"📋 SOAP preview: {result.get('soap_note', 'N/A')[:150]}...")
            else:
                print(f"❌ {pdf_file} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error processing {pdf_file}: {e}")
    
    # Test multiple PDFs together
    if len(pdf_files) > 1:
        print(f"\n🔍 Testing multiple PDFs together...")
        try:
            with open(pdf_files[0], 'rb') as f1, open(pdf_files[1], 'rb') as f2:
                files = [
                    ('files', (pdf_files[0], f1, 'application/pdf')),
                    ('files', (pdf_files[1], f2, 'application/pdf'))
                ]
                response = requests.post('http://localhost:8000/api/process-multiple-files', files=files)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Multiple PDFs processed successfully!")
                print(f"📄 Combined text length: {len(result.get('transcription', ''))}")
                print(f"🔍 Diagnosis: {result.get('diagnosis', 'N/A')}")
                print(f"📋 SOAP preview: {result.get('soap_note', 'N/A')[:200]}...")
            else:
                print(f"❌ Multiple PDFs failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error processing multiple PDFs: {e}")

if __name__ == "__main__":
    test_with_real_pdfs()
