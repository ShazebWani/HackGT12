from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import csv
import os
import asyncio
import assemblyai as aai
import json
from dotenv import load_dotenv
from database import database, transcripts
from agents.soap_agent import generate_soap_note

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="ScribeAgent AI Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store billing codes
billing_codes: Dict[str, str] = {}

# Pydantic models for API response structure
class BillingCode(BaseModel):
    code: str
    description: str

class Prescription(BaseModel):
    medication: str
    dosage: str
    frequency: str
    duration: str

class ScribeAgentResponse(BaseModel):
    transcription: str
    soap_note: str
    diagnosis: str
    billing_code: BillingCode
    prescriptions: List[Prescription]
    lab_orders: List[str]

# Mock AI functions
async def transcribe_audio_mock(audio_bytes: bytes) -> str:
    """Mock transcription function"""
    return "Patient is a 34-year-old male presenting with a sore throat, fever, and swollen lymph nodes. Rapid strep test was positive. Diagnosis is acute streptococcal pharyngitis. I'm prescribing Amoxicillin 500mg, twice daily for 10 days, and ordering a follow-up throat culture."

async def extract_entities_mock(transcription: str) -> dict:
    """Mock entity extraction function"""
    return {
        "diagnosis": "streptococcal pharyngitis",
        "medication": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "twice daily",
        "duration": "10 days",
        "lab_orders": ["throat culture"]
    }


# Billing code functions
def load_billing_codes():
    """Load billing codes from CSV file into memory for fast lookups"""
    global billing_codes
    csv_path = os.path.join("data", "icd10_codes.csv")
    
    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                diagnosis_keyword = row['diagnosis_keyword'].lower().strip()
                code = row['code'].strip()
                billing_codes[diagnosis_keyword] = code
        print(f"Loaded {len(billing_codes)} billing codes from CSV")
    except FileNotFoundError:
        print(f"Warning: Could not find billing codes CSV at {csv_path}")
    except Exception as e:
        print(f"Error loading billing codes: {e}")

def get_billing_code(diagnosis: str) -> BillingCode:
    """Look up billing code for a given diagnosis"""
    diagnosis_lower = diagnosis.lower().strip()
    
    # Direct match first
    if diagnosis_lower in billing_codes:
        code = billing_codes[diagnosis_lower]
        return BillingCode(code=code, description=diagnosis)
    
    # Partial match - check if any keyword contains or is contained in the diagnosis
    for keyword, code in billing_codes.items():
        if keyword in diagnosis_lower or diagnosis_lower in keyword:
            return BillingCode(code=code, description=diagnosis)
    
    # Default if no match found
    return BillingCode(code="R00.0", description=f"Unspecified diagnosis: {diagnosis}")

# Load billing codes on startup
load_billing_codes()

# Configure AssemblyAI with environment variable
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

# Database startup and shutdown handlers
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": "ScribeAgent AI Backend is running"}

@app.post("/api/process-visit", response_model=ScribeAgentResponse)
async def process_visit(request: Request):
    """
    Accept an audio file upload and return complete structured medical data
    """
    try:
        # Read the raw audio data from the request body
        audio_bytes = await request.body()
        print(f"📥 Received audio data: {len(audio_bytes)} bytes")
        print(f"🔍 Audio data type: {type(audio_bytes)}")
        print(f"📊 First 50 bytes: {audio_bytes[:50]}")
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="No audio data received")
        
        # Step 1: Transcribe audio (mock for now, but could integrate with AssemblyAI)
        transcription = await transcribe_audio_mock(audio_bytes)
        print(f"📝 Transcription: {transcription[:100]}...")
        
        # Step 2: Extract entities from transcription (mock)
        entities = await extract_entities_mock(transcription)
        
        # Step 3: Generate SOAP note using the new Mastra agent
        soap_note = await generate_soap_note(transcription)
        
        # Step 4: Get billing code using real lookup function
        billing_code = get_billing_code(entities["diagnosis"])
        
        # Step 5: Create prescriptions from extracted entities
        prescriptions = [
            Prescription(
                medication=entities["medication"],
                dosage=entities["dosage"],
                frequency=entities["frequency"],
                duration=entities["duration"]
            )
        ]
        
        # Step 6: Assemble final response
        response = ScribeAgentResponse(
            transcription=transcription,
            soap_note=soap_note,
            diagnosis=entities["diagnosis"],
            billing_code=billing_code,
            prescriptions=prescriptions,
            lab_orders=entities["lab_orders"]
        )
        
        print("✅ Processing complete, returning response")
        return response
        
    except Exception as e:
        print(f"❌ Error processing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

async def save_transcript_to_db(text: str):
    """Save transcript to database"""
    try:
        query = transcripts.insert().values(full_text=text)
        await database.execute(query)
        print(f"Transcript saved to database: {text[:50]}...")
    except Exception as e:
        print(f"Error saving transcript to database: {e}")

async def run_final_processing(transcript: str) -> dict:
    """Run final processing on the complete transcript"""
    try:
        # Step 1: Extract entities from the final transcript
        entities = await extract_entities_mock(transcript)
        
        # Step 2: Generate SOAP note using the new Mastra agent
        soap_note = await generate_soap_note(transcript)
        
        # Step 3: Get billing code using real lookup function
        billing_code = get_billing_code(entities["diagnosis"])
        
        # Step 4: Create prescriptions from extracted entities
        prescriptions = [
            Prescription(
                medication=entities["medication"],
                dosage=entities["dosage"],
                frequency=entities["frequency"],
                duration=entities["duration"]
            )
        ]
        
        # Step 5: Assemble final response
        final_response = ScribeAgentResponse(
            transcription=transcript,
            soap_note=soap_note,
            diagnosis=entities["diagnosis"],
            billing_code=billing_code,
            prescriptions=prescriptions,
            lab_orders=entities["lab_orders"]
        )
        
        return final_response.dict()
    except Exception as e:
        print(f"Error in final processing: {e}")
        return {"error": str(e)}

@app.websocket("/ws/process-visit")
async def websocket_process_visit(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming and transcription
    """
    await websocket.accept()
    print("✅ WebSocket connection established")
    
    # Storage for the complete final transcript
    final_transcript = ""
    audio_chunks_received = 0
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "message": "WebSocket connected successfully"
        })
        
        # Simple audio handling without AssemblyAI for now
        async def handle_audio_stream():
            """Handle incoming audio from client"""
            nonlocal final_transcript, audio_chunks_received
            try:
                while True:
                    # Receive audio data from client
                    data = await websocket.receive_bytes()
                    audio_chunks_received += 1
                    print(f"📥 Received audio chunk #{audio_chunks_received}: {len(data)} bytes")
                    
                    # For now, just acknowledge receipt
                    if audio_chunks_received % 10 == 0:  # Every 10 chunks
                        await websocket.send_json({
                            "type": "partial_transcript",
                            "text": f"Received {audio_chunks_received} audio chunks...",
                            "is_final": False
                        })
                        
            except WebSocketDisconnect:
                print("🔌 Client disconnected during audio streaming")
            except Exception as e:
                print(f"❌ Error in audio streaming: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Audio processing error: {str(e)}"
                })
        
        # Start audio handling task
        audio_task = asyncio.create_task(handle_audio_stream())
        
        # Wait for the audio task to complete
        await audio_task
        
        # Simulate final processing after a delay
        if audio_chunks_received > 0:
            print(f"🎯 Processing {audio_chunks_received} audio chunks...")
            
            # Simulate processing time
            await asyncio.sleep(2)
            
            # Create a mock final transcript
            final_transcript = "Patient is a 34-year-old male presenting with sore throat symptoms. This is a test transcription from the WebSocket connection."
            
            # Save to database
            await save_transcript_to_db(final_transcript)
            
            # Run final processing
            result = await run_final_processing(final_transcript)
            
            # Send final result
            await websocket.send_json({
                "type": "final_result",
                "data": result
            })
        
    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"WebSocket error: {str(e)}"
            })
        except:
            pass
    finally:
        print("🏁 Client disconnected")

