#!/usr/bin/env python3
"""
Startup script for the ScribeAgent AI Backend
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Check if API key is set
    api_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("⚠️  WARNING: AssemblyAI API key not set!")
        print("Please set your API key in the .env file:")
        print("ASSEMBLYAI_API_KEY=your_actual_api_key_here")
        print()
    
    print("🚀 Starting ScribeAgent AI Backend...")
    print("📡 WebSocket endpoint: ws://localhost:8000/ws/process-visit")
    print("🌐 API docs: http://localhost:8000/docs")
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
