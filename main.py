from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import csv
import os
import asyncio
import assemblyai as aai
from backend.realtime_transcribe import AudioTranscribe
import threading
import json
from datetime import datetime
from dotenv import load_dotenv
from database import database, transcripts, patients
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

class PatientCreate(BaseModel):
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: str

class PatientUpdate(BaseModel):
    mrn: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    medical_data: Optional[dict] = None

class PatientResponse(BaseModel):
    id: str
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: str
    last_updated: str
    medical_data: Optional[dict] = None

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

# Patient API endpoints
@app.post("/api/patients", response_model=PatientResponse)
async def create_patient(patient: PatientCreate):
    """Create a new patient"""
    try:
        # Generate unique ID
        patient_id = f"patient-{int(datetime.utcnow().timestamp() * 1000)}"
        
        # Check if MRN already exists
        query = patients.select().where(patients.c.mrn == patient.mrn)
        existing = await database.fetch_one(query)
        if existing:
            raise HTTPException(status_code=400, detail="Patient with this MRN already exists")
        
        # Insert new patient
        insert_query = patients.insert().values(
            id=patient_id,
            mrn=patient.mrn,
            first_name=patient.first_name,
            last_name=patient.last_name,
            date_of_birth=patient.date_of_birth,
            last_updated=datetime.utcnow(),
            medical_data=None
        )
        await database.execute(insert_query)
        
        # Return the created patient
        return PatientResponse(
            id=patient_id,
            mrn=patient.mrn,
            first_name=patient.first_name,
            last_name=patient.last_name,
            date_of_birth=patient.date_of_birth,
            last_updated=datetime.utcnow().isoformat(),
            medical_data=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/patients", response_model=List[PatientResponse])
async def get_patients():
    """Get all patients"""
    try:
        query = patients.select().order_by(patients.c.last_updated.desc())
        results = await database.fetch_all(query)
        
        patients_list = []
        for row in results:
            medical_data = None
            if row.medical_data:
                try:
                    medical_data = json.loads(row.medical_data)
                except:
                    medical_data = None
            
            patients_list.append(PatientResponse(
                id=row.id,
                mrn=row.mrn,
                first_name=row.first_name,
                last_name=row.last_name,
                date_of_birth=row.date_of_birth,
                last_updated=row.last_updated.isoformat(),
                medical_data=medical_data
            ))
        
        return patients_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    """Get a specific patient by ID"""
    try:
        query = patients.select().where(patients.c.id == patient_id)
        result = await database.fetch_one(query)
        
        if not result:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        medical_data = None
        if result.medical_data:
            try:
                medical_data = json.loads(result.medical_data)
            except:
                medical_data = None
        
        return PatientResponse(
            id=result.id,
            mrn=result.mrn,
            first_name=result.first_name,
            last_name=result.last_name,
            date_of_birth=result.date_of_birth,
            last_updated=result.last_updated.isoformat(),
            medical_data=medical_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, patient_update: PatientUpdate):
    """Update a patient"""
    try:
        # Check if patient exists
        query = patients.select().where(patients.c.id == patient_id)
        existing = await database.fetch_one(query)
        if not existing:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Build update data
        update_data = {}
        if patient_update.mrn is not None:
            # Check if new MRN already exists
            if patient_update.mrn != existing.mrn:
                mrn_query = patients.select().where(patients.c.mrn == patient_update.mrn)
                mrn_existing = await database.fetch_one(mrn_query)
                if mrn_existing:
                    raise HTTPException(status_code=400, detail="Patient with this MRN already exists")
            update_data["mrn"] = patient_update.mrn
        if patient_update.first_name is not None:
            update_data["first_name"] = patient_update.first_name
        if patient_update.last_name is not None:
            update_data["last_name"] = patient_update.last_name
        if patient_update.date_of_birth is not None:
            update_data["date_of_birth"] = patient_update.date_of_birth
        if patient_update.medical_data is not None:
            update_data["medical_data"] = json.dumps(patient_update.medical_data)
        
        update_data["last_updated"] = datetime.utcnow()
        
        # Update patient
        update_query = patients.update().where(patients.c.id == patient_id).values(**update_data)
        await database.execute(update_query)
        
        # Return updated patient
        updated_query = patients.select().where(patients.c.id == patient_id)
        updated = await database.fetch_one(updated_query)
        
        medical_data = None
        if updated.medical_data:
            try:
                medical_data = json.loads(updated.medical_data)
            except:
                medical_data = None
        
        return PatientResponse(
            id=updated.id,
            mrn=updated.mrn,
            first_name=updated.first_name,
            last_name=updated.last_name,
            date_of_birth=updated.date_of_birth,
            last_updated=updated.last_updated.isoformat(),
            medical_data=medical_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete a patient"""
    try:
        # Check if patient exists
        query = patients.select().where(patients.c.id == patient_id)
        existing = await database.fetch_one(query)
        if not existing:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Delete patient
        delete_query = patients.delete().where(patients.c.id == patient_id)
        await database.execute(delete_query)
        
        return {"message": "Patient deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    
    # Step 3: Generate SOAP note using the real SOAP agent
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
    
    return response

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
        
        # Step 2: Generate SOAP note using the real SOAP agent
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
    print("WebSocket connection established")
    
    # Storage for the complete final transcript
    final_transcript = ""
    
    async def handle_partial_transcript_local(data):
        """Handle partial transcript data from AssemblyAI"""
        nonlocal final_transcript
        try:
            if data.text:
                final_transcript = data.text
                # Send partial transcript to client
                await websocket.send_json({
                    "type": "partial_transcript",
                    "text": data.text,
                    "is_final": data.is_final
                })
                print(f"Partial transcript: {data.text}")
        except Exception as e:
            print(f"Error handling partial transcript: {e}")

    async def handle_error_local(error):
        """Handle errors from AssemblyAI"""
        try:
            print(f"AssemblyAI error: {error}")
            await websocket.send_json({
                "type": "error",
                "message": f"Transcription error: {str(error)}"
            })
        except Exception as e:
            print(f"Error handling AssemblyAI error: {e}")

    async def handle_close_local():
        """Handle AssemblyAI stream close"""
        try:
            print(f"AssemblyAI stream closed. Final transcript: {final_transcript}")
            
            if final_transcript:
                # Save transcript to database
                await save_transcript_to_db(final_transcript)
                
                # Run final processing
                result = await run_final_processing(final_transcript)
                
                # Send final result to client
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
                
                await websocket.send_json({
                    "type": "final_result",
                    "data": result
                })
        except Exception as e:
            print(f"Error in handle_close: {e}")
            await websocket.send_json({
                "type": "error",
                "message": f"Error processing final transcript: {str(e)}"
            })
    
    try:
        # Create AssemblyAI streaming client
        client = aai.RealtimeTranscriber(
            sample_rate=16000,
            on_data=lambda data: asyncio.create_task(handle_partial_transcript_local(data)),
            on_error=lambda error: asyncio.create_task(handle_error_local(error)),
            on_close=lambda: asyncio.create_task(handle_close_local())
        )
        
        # Connect to AssemblyAI
        client.connect()
        
        async def handle_audio_stream():
            """Handle incoming audio from client and send to AssemblyAI"""
            try:
                while True:
                    # Receive audio data from client
                    data = await websocket.receive_bytes()
                    # Send to AssemblyAI streaming client
                    client.stream(data)
            except WebSocketDisconnect:
                print("Client disconnected during audio streaming")
                client.close()
            except Exception as e:
                print(f"Error in audio streaming: {e}")
                client.close()
        
        # Start audio handling task
        audio_task = asyncio.create_task(handle_audio_stream())
        
        # Wait for the audio task to complete
        await audio_task
        
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        print("Client disconnected")


@app.websocket("/ws/transcription")
async def transcription(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket transcription connection established")

    stop_event = threading.Event()
    transcriber = AudioTranscribe()

    transcript_queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_running_loop()
    
    # State variable to track if final result has been sent
    final_result_sent = False # <-- New state tracker

    def on_final_cb(full_text: str):
        print("on_final_cb")
        try:
            print("Processing final transcript with SOAP agent...")
            # Process the transcript through SOAP agent
            asyncio.run_coroutine_threadsafe(process_transcript_with_soap(full_text.strip()), loop)
            
        except Exception as e:
            print(f"Error in on_final_cb: {e}")
            # Fallback to just sending transcription
            transcript_queue.put_nowait({
                "type": "final_result",
                "data": {"transcription": full_text.strip()},
                "is_final": True
            })

    async def process_transcript_with_soap(transcript: str):
        """Process transcript through SOAP agent and send results"""
        try:
            print(f"🤖 Processing transcript with SOAP agent: {transcript[:100]}...")
            
            # Run final processing with SOAP agent
            medical_data = await run_final_processing(transcript)
            
            print(f"📋 SOAP agent generated medical data: {medical_data.keys() if isinstance(medical_data, dict) else 'Not a dict'}")
            print(f"📋 Medical data structure: {medical_data}")
            
            # Send structured medical data to client
            transcript_queue.put_nowait({
                "type": "final_result",
                "data": medical_data,
                "is_final": True
            })
            
            print("✅ SOAP processing complete, medical data sent to client")
            
        except Exception as e:
            print(f"❌ Error processing transcript with SOAP agent: {e}")
            # Fallback to just sending transcription
            transcript_queue.put_nowait({
                "type": "final_result",
                "data": {"transcription": transcript},
                "is_final": True
            })

    def run_transcriber():
        transcriber.run( stop_event=stop_event, on_final=on_final_cb)

        

    thread = threading.Thread(target=run_transcriber, daemon=True)
    thread.start()

    try:
        while True:
            recv_task = asyncio.create_task(websocket.receive_text()) # Changed to _text for safety
            q_task = asyncio.create_task(transcript_queue.get())
            done, pending = await asyncio.wait(
                [recv_task, q_task],
                return_when=asyncio.FIRST_COMPLETED
            )

            # 1. Handle incoming WS messages (client closing or END_OF_STREAM)
            if recv_task in done:
                try:
                    # Use receive_text() if we only expect JSON text
                    text = recv_task.result() 
                    data = json.loads(text)
                    if data.get("type") == "END_OF_STREAM":
                        print("Received END_OF_STREAM from client. Setting stop event.")
                        stop_event.set()
                except WebSocketDisconnect:
                    print("Client disconnected (recv)")
                    break
                except Exception as e:
                    # Handles JSON decode error or other receive issues
                    print(f"Error receiving message: {e}")
                    # If an error happens while waiting for END_OF_STREAM, we break.
                    break 

            # 2. Handle transcripts from queue
            if q_task in done:
                transcript_item = q_task.result()
                try:
                    await websocket.send_json(transcript_item)
                    if transcript_item.get("type") == "final_result":
                        print("Final result sent. Waiting for client to close connection.")
                        final_result_sent = True
                except Exception as e:
                    print(f"Error sending transcript: {e}")
                    # If send fails, we assume the connection is dead and break
                    break 

            # 3. Cancel pending tasks
            for p in pending:
                p.cancel()

            # 4. Break condition: Only break if the final result has been sent
            # AND the stop event is set AND the queue is empty.
            # However, since the client is supposed to close after final_result,
            # we can simplify and wait for the subsequent WebSocketDisconnect.
            if final_result_sent and transcript_queue.empty():
                # We sent the final result. Now, we loop again to wait for the
                # inevitable WebSocketDisconnect from the client.
                pass 

            if stop_event.is_set() and transcript_queue.empty() and final_result_sent:
                print("Stop event set and queue empty, but no final result. Closing.")
                return
            
    except WebSocketDisconnect:
        print("Client disconnected from transcription websocket")
    finally:
        # Ensure thread stops cleanly
        stop_event.set()
        if thread.is_alive():
            thread.join(timeout=2.0)
            print("Transcriber thread joined.")
        print("Transcription websocket handler exiting")
