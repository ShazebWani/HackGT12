#!/usr/bin/env python3
"""
Simple test script to demonstrate the ScribeAgent AI API
"""

import requests
import json

def test_api():
    url = "http://localhost:8000/api/process-visit"
    
    # Create a dummy audio file for testing
    dummy_audio_content = b"This is a dummy audio file for testing"
    
    files = {
        'file': ('test_audio.wav', dummy_audio_content, 'audio/wav')
    }
    
    try:
        print("Testing ScribeAgent AI API...")
        print(f"POST {url}")
        
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print("✅ Success! API returned 200 OK")
            print("\nResponse JSON:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Error: API returned {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API. Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()
