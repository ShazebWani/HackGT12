from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import csv
import os
import asyncio
import assemblyai as aai
import json

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

async def generate_soap_note_mock(entities: dict) -> str:
    """Mock SOAP note generation function"""
    return """SUBJECTIVE:
34-year-old male presents with chief complaint of sore throat, fever, and swollen lymph nodes.

OBJECTIVE:
Physical examination reveals erythematous throat with tonsillar exudate. Palpable cervical lymphadenopathy noted. Rapid strep test positive.

ASSESSMENT:
Acute streptococcal pharyngitis (J02.0)

PLAN:
1. Prescribe Amoxicillin 500mg twice daily for 10 days
2. Order follow-up throat culture
3. Patient advised to return if symptoms worsen or persist"""

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

# Configure AssemblyAI (you'll need to set your API key)
aai.settings.api_key = "your_assemblyai_api_key_here"  # Replace with actual API key

@app.get("/")
async def root():
    return {"message": "ScribeAgent AI Backend is running"}

@app.post("/api/process-visit", response_model=ScribeAgentResponse)
async def process_visit(file: UploadFile = File(...)):
    """
    Accept an audio file upload and return complete structured medical data
    """
    # Read the audio file content
    audio_bytes = await file.read()
    
    # Step 1: Transcribe audio (mock)
    transcription = await transcribe_audio_mock(audio_bytes)
    
    # Step 2: Extract entities from transcription (mock)
    entities = await extract_entities_mock(transcription)
    
    # Step 3: Generate SOAP note from entities (mock)
    soap_note = await generate_soap_note_mock(entities)
    
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
    
    return response

@app.websocket("/ws/process-visit")
async def websocket_process_visit(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming and transcription
    """
    await websocket.accept()
    print("WebSocket connection established")
    
    # Storage for the complete final transcript
    final_transcript = ""
    audio_queue = asyncio.Queue()
    transcription_active = True
    
    try:
        # Set up the streaming transcriber (mock for now since we need API key)
        # In production, you would use: transcriber = aai.RealtimeTranscriber(...)
        
        async def send_audio():
            """Send audio chunks from client to transcription service"""
            nonlocal transcription_active
            while transcription_active:
                try:
                    # Get audio data from the queue
                    audio_data = await asyncio.wait_for(audio_queue.get(), timeout=1.0)
                    if audio_data is None:  # Sentinel value to stop
                        break
                    print(f"Processing {len(audio_data)} bytes of audio")
                    # In production: transcriber.stream(audio_data)
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"Error in send_audio: {e}")
                    break
        
        async def receive_transcripts():
            """Receive transcripts from the service and send to client"""
            nonlocal final_transcript, transcription_active
            transcript_counter = 0
            
            while transcription_active:
                try:
                    # Mock transcription results for demo
                    await asyncio.sleep(2)  # Simulate processing delay
                    
                    if transcript_counter == 0:
                        partial_text = "Patient is a"
                    elif transcript_counter == 1:
                        partial_text = "Patient is a 34-year-old"
                    elif transcript_counter == 2:
                        partial_text = "Patient is a 34-year-old male presenting with"
                    else:
                        partial_text = "Patient is a 34-year-old male presenting with sore throat symptoms"
                    
                    # Send partial transcript to client
                    await websocket.send_json({
                        "type": "partial_transcript",
                        "text": partial_text,
                        "is_final": False
                    })
                    
                    final_transcript = partial_text
                    transcript_counter += 1
                    
                    if transcript_counter >= 4:
                        break
                        
                except Exception as e:
                    print(f"Error in receive_transcripts: {e}")
                    break
        
        async def handle_client_messages():
            """Handle incoming messages from the WebSocket client"""
            nonlocal transcription_active
            
            while transcription_active:
                try:
                    message = await websocket.receive()
                    
                    if message["type"] == "websocket.disconnect":
                        break
                    elif message["type"] == "websocket.receive":
                        if "bytes" in message:
                            # Audio data received
                            audio_data = message["bytes"]
                            await audio_queue.put(audio_data)
                        elif "text" in message:
                            # Text message received
                            text_message = message["text"]
                            if text_message == "END_OF_STREAM":
                                print("End of stream signal received")
                                transcription_active = False
                                await audio_queue.put(None)  # Sentinel to stop audio processing
                                break
                                
                except WebSocketDisconnect:
                    print("Client disconnected during message handling")
                    transcription_active = False
                    break
                except Exception as e:
                    print(f"Error handling client message: {e}")
                    break
        
        # Start all concurrent tasks
        tasks = [
            asyncio.create_task(send_audio()),
            asyncio.create_task(receive_transcripts()),
            asyncio.create_task(handle_client_messages())
        ]
        
        # Wait for any task to complete (usually the client message handler when END_OF_STREAM is received)
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        
        # Cancel remaining tasks
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        print(f"Final transcript collected: {final_transcript}")
        
        # Process the final transcript through our existing business logic
        if final_transcript:
            try:
                print("Processing final transcript through business logic...")
                
                # Step 1: Extract entities from the final transcript
                entities = await extract_entities_mock(final_transcript)
                
                # Step 2: Generate SOAP note from entities
                soap_note = await generate_soap_note_mock(entities)
                
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
                    transcription=final_transcript,
                    soap_note=soap_note,
                    diagnosis=entities["diagnosis"],
                    billing_code=billing_code,
                    prescriptions=prescriptions,
                    lab_orders=entities["lab_orders"]
                )
                
                # Step 6: Send final structured result to client
                await websocket.send_json({
                    "type": "final_result",
                    "data": final_response.dict()
                })
                
                print("Final structured response sent to client")
                
            except Exception as e:
                print(f"Error processing final transcript: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Error processing transcript: {str(e)}"
                })
        
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        print("Client disconnected")
