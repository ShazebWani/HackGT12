#!/usr/bin/env python3
"""
Startup script for the ScribeAgent AI Backend (No Speech Recognition)
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    print("🚀 Starting ScribeAgent AI Backend (No Speech Recognition)...")
    print("🌐 API docs: http://localhost:8000/docs")
    print("📝 Text processing endpoint: POST http://localhost:8000/api/process-text")
    print("📁 Audio file endpoint: POST http://localhost:8000/api/process-visit")
    print()
    
    uvicorn.run(
        "main_no_speech:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )