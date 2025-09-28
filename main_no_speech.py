from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import csv
import os
import asyncio
import json
from datetime import datetime
from dotenv import load_dotenv
from database import database, transcripts, patients
from agents.soap_agent import generate_soap_note

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="ScribeAgent AI Backend (No Speech Recognition)", version="1.0.0")

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

class TextInput(BaseModel):
    text: str

# TODO: Replace with real AI functions
async def transcribe_audio_mock(audio_bytes: bytes) -> str:
    """TODO: Replace with real transcription function using OpenAI Whisper or similar"""
    raise NotImplementedError("Replace with real transcription implementation")

async def extract_entities_mock(transcription: str) -> dict:
    """TODO: Replace with real entity extraction function using LLM"""
    raise NotImplementedError("Replace with real entity extraction implementation")

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

# Database startup and shutdown handlers
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": "ScribeAgent AI Backend (No Speech Recognition) is running"}

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

@app.post("/api/process-text", response_model=ScribeAgentResponse)
async def process_text(text_input: TextInput):
    """
    Accept text input and return complete structured medical data
    """
    
    transcription = text_input.text
    
    # Step 1: Extract entities from transcription (mock)
    entities = await extract_entities_mock(transcription)
    
    # Step 2: Generate SOAP note using the real SOAP agent
    soap_note = await generate_soap_note(transcription)
    
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