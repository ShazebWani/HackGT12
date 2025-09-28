from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import csv
import os
import asyncio
from backend.realtime_transcribe import AudioTranscribe
import threading
import json
from datetime import datetime
from dotenv import load_dotenv
from database import database, transcripts, patients
from agents.mastra_soap_agent import generate_soap_note
import pdfplumber
import PyPDF2
import io

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

class TextContextRequest(BaseModel):
    text: str
    context_type: Optional[str] = "general"  # "general", "medical_notes", "patient_history", etc.

class PatientResponse(BaseModel):
    id: str
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: str
    last_updated: str
    medical_data: Optional[dict] = None

async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio using OpenAI Whisper API"""
    try:
        import openai
        from openai import OpenAI
        
        # Initialize OpenAI client
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Create a temporary file for the audio
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            tmp_file.write(audio_bytes)
            tmp_file_path = tmp_file.name
        
        try:
            # Transcribe using OpenAI Whisper
            with open(tmp_file_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en"  # Force English for medical context
                )
            
            return transcription.text.strip()
            
        finally:
            # Clean up temporary file
            import os
            try:
                os.unlink(tmp_file_path)
            except:
                pass
                
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")

async def extract_entities(transcription: str) -> dict:
    """Extract medical entities from transcription using LLM"""
    try:
        from openai import OpenAI
        
        # Initialize OpenAI client
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Create a structured prompt for entity extraction
        prompt = f"""
        Extract medical entities from the following patient visit transcription. 
        Return a JSON object with the following structure:
        {{
            "diagnosis": "Primary diagnosis or condition mentioned",
            "medication": "Medication name if mentioned",
            "dosage": "Dosage if mentioned",
            "frequency": "Frequency if mentioned", 
            "duration": "Duration if mentioned",
            "lab_orders": ["List of lab orders or tests mentioned"]
        }}
        
        If any information is not available, use null for that field.
        Focus on extracting actual medical information from the transcription.
        
        Transcription: {transcription}
        """
        
        # Call OpenAI API for entity extraction
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a medical AI assistant that extracts structured medical information from patient visit transcripts. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=500
        )
        
        # Parse the JSON response
        import json
        try:
            entities = json.loads(response.choices[0].message.content)
            
            # Ensure all required fields exist with defaults
            return {
                "diagnosis": entities.get("diagnosis") or "Not specified",
                "medication": entities.get("medication") or "Not specified", 
                "dosage": entities.get("dosage") or "Not specified",
                "frequency": entities.get("frequency") or "Not specified",
                "duration": entities.get("duration") or "Not specified",
                "lab_orders": entities.get("lab_orders") or []
            }
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "diagnosis": "Unable to extract diagnosis",
                "medication": "Not specified",
                "dosage": "Not specified", 
                "frequency": "Not specified",
                "duration": "Not specified",
                "lab_orders": []
            }
            
    except Exception as e:
        print(f"Error extracting entities: {e}")
        # Return safe defaults on error
        return {
            "diagnosis": "Error in entity extraction",
            "medication": "Not specified",
            "dosage": "Not specified",
            "frequency": "Not specified", 
            "duration": "Not specified",
            "lab_orders": []
        }

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file using pdfplumber (preferred) or PyPDF2 as fallback"""
    try:
        # Try pdfplumber first (better text extraction)
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        print(f"pdfplumber failed, trying PyPDF2: {e}")
        try:
            # Fallback to PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e2:
            print(f"Both PDF libraries failed: {e2}")
            raise Exception("Failed to extract text from PDF file")


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
    
    # Step 1: Transcribe audio using OpenAI Whisper
    transcription = await transcribe_audio(audio_bytes)
    
    # Step 2: Extract entities from transcription using LLM
    entities = await extract_entities(transcription)
    
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

@app.post("/api/process-text-context", response_model=ScribeAgentResponse)
async def process_text_context(request: TextContextRequest):
    """
    Process text context through SOAP agent and return structured medical data
    """
    try:
        print(f"📝 Processing text context: {request.text[:100]}...")
        print(f"📝 Context type: {request.context_type}")
        
        # Process the text through SOAP agent with context
        medical_data = await run_final_processing_with_context(request.text, request.context_type)
        
        # Check if we got structured JSON data from Mastra
        if isinstance(medical_data, dict) and 'error' not in medical_data:
            # We got structured data - use it directly
            return ScribeAgentResponse(
                transcription=medical_data.get('transcription', request.text),
                soap_note=medical_data.get('soap_note', 'SOAP note not generated'),
                diagnosis=medical_data.get('diagnosis', 'Not specified'),
                billing_code=BillingCode(
                    code=medical_data.get('billing_code', {}).get('code', 'R69'),
                    description=medical_data.get('billing_code', {}).get('description', 'Illness, unspecified')
                ),
                prescriptions=[
                    Prescription(
                        medication=rx.get('medication', 'Not specified'),
                        dosage=rx.get('dosage', 'Not specified'),
                        frequency=rx.get('frequency', 'Not specified'),
                        duration=rx.get('duration', 'Not specified')
                    ) for rx in medical_data.get('prescriptions', [])
                ] if medical_data.get('prescriptions') else [],
                lab_orders=medical_data.get('lab_orders', [])
            )
        else:
            # Fallback processing
            entities = await extract_entities(request.text)
            billing_code = get_billing_code(entities["diagnosis"])
            
            prescriptions = [
                Prescription(
                    medication=entities["medication"],
                    dosage=entities["dosage"],
                    frequency=entities["frequency"],
                    duration=entities["duration"]
                )
            ]
            
            return ScribeAgentResponse(
                transcription=request.text,
                soap_note=f"Context: {request.context_type}\n\n{request.text}",
                diagnosis=entities["diagnosis"],
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=entities["lab_orders"]
            )
            
    except Exception as e:
        print(f"❌ Error processing text context: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing text context: {str(e)}")

@app.post("/api/process-pdf", response_model=ScribeAgentResponse)
async def process_pdf_file(file: UploadFile = File(...)):
    """
    Process PDF file and extract text, then process through SOAP agent
    """
    try:
        # Validate file type
        if not file.content_type == "application/pdf" and not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read file content
        file_content = await file.read()
        
        # Extract text from PDF
        print(f"📄 Extracting text from PDF: {file.filename}")
        extracted_text = extract_text_from_pdf(file_content)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from PDF")
        
        print(f"📄 Extracted text length: {len(extracted_text)} characters")
        
        # Process the extracted text through SOAP agent
        medical_data = await run_final_processing_with_context(extracted_text, "medical_document")
        
        # Check if we got structured JSON data from Mastra
        if isinstance(medical_data, dict) and 'error' not in medical_data:
            # We got structured data - use it directly
            return ScribeAgentResponse(
                transcription=medical_data.get('transcription', extracted_text),
                soap_note=medical_data.get('soap_note', 'SOAP note not generated'),
                diagnosis=medical_data.get('diagnosis', 'Not specified'),
                billing_code=BillingCode(
                    code=medical_data.get('billing_code', {}).get('code', 'R69'),
                    description=medical_data.get('billing_code', {}).get('description', 'Illness, unspecified')
                ),
                prescriptions=[
                    Prescription(
                        medication=rx.get('medication', 'Not specified'),
                        dosage=rx.get('dosage', 'Not specified'),
                        frequency=rx.get('frequency', 'Not specified'),
                        duration=rx.get('duration', 'Not specified')
                    ) for rx in medical_data.get('prescriptions', [])
                ] if medical_data.get('prescriptions') else [],
                lab_orders=medical_data.get('lab_orders', [])
            )
        else:
            # Fallback processing
            entities = await extract_entities(extracted_text)
            billing_code = get_billing_code(entities["diagnosis"])
            
            prescriptions = [
                Prescription(
                    medication=entities["medication"],
                    dosage=entities["dosage"],
                    frequency=entities["frequency"],
                    duration=entities["duration"]
                )
            ]
            
            return ScribeAgentResponse(
                transcription=extracted_text,
                soap_note=f"PDF Document Analysis:\n\n{extracted_text}",
                diagnosis=entities["diagnosis"],
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=entities["lab_orders"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")

@app.post("/api/process-multiple-files", response_model=ScribeAgentResponse)
async def process_multiple_files(files: List[UploadFile] = File(...)):
    """
    Process multiple files (text and PDF) and combine their content for SOAP analysis
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        print(f"📁 Processing {len(files)} files")
        
        all_texts = []
        
        for file in files:
            # Validate file type
            if not (file.content_type in ["text/plain", "application/pdf"] or 
                   file.filename.endswith(('.txt', '.pdf'))):
                print(f"⚠️ Skipping unsupported file: {file.filename}")
                continue
            
            # Read file content
            file_content = await file.read()
            
            if file.content_type == "application/pdf" or file.filename.endswith('.pdf'):
                # Extract text from PDF
                print(f"📄 Extracting text from PDF: {file.filename}")
                try:
                    extracted_text = extract_text_from_pdf(file_content)
                    if extracted_text.strip():
                        all_texts.append(f"=== {file.filename} ===\n{extracted_text}")
                    else:
                        print(f"⚠️ No text extracted from PDF: {file.filename}")
                except Exception as e:
                    print(f"❌ Error extracting text from PDF {file.filename}: {e}")
                    continue
            else:
                # Read text file content
                print(f"📝 Reading text file: {file.filename}")
                try:
                    text_content = file_content.decode('utf-8')
                    if text_content.strip():
                        all_texts.append(f"=== {file.filename} ===\n{text_content}")
                    else:
                        print(f"⚠️ Empty text file: {file.filename}")
                except Exception as e:
                    print(f"❌ Error reading text file {file.filename}: {e}")
                    continue
        
        if not all_texts:
            raise HTTPException(status_code=400, detail="No valid text content found in any files")
        
        # Combine all text content
        combined_text = "\n\n".join(all_texts)
        print(f"📝 Combined text length: {len(combined_text)} characters from {len(all_texts)} files")
        
        # Process the combined text through SOAP agent
        medical_data = await run_final_processing_with_context(combined_text, "multiple_documents")
        
        # Check if we got structured JSON data from Mastra
        if isinstance(medical_data, dict) and 'error' not in medical_data:
            # We got structured data - use it directly
            return ScribeAgentResponse(
                transcription=medical_data.get('transcription', combined_text),
                soap_note=medical_data.get('soap_note', 'SOAP note not generated'),
                diagnosis=medical_data.get('diagnosis', 'Not specified'),
                billing_code=BillingCode(
                    code=medical_data.get('billing_code', {}).get('code', 'R69'),
                    description=medical_data.get('billing_code', {}).get('description', 'Illness, unspecified')
                ),
                prescriptions=[
                    Prescription(
                        medication=rx.get('medication', 'Not specified'),
                        dosage=rx.get('dosage', 'Not specified'),
                        frequency=rx.get('frequency', 'Not specified'),
                        duration=rx.get('duration', 'Not specified')
                    ) for rx in medical_data.get('prescriptions', [])
                ] if medical_data.get('prescriptions') else [],
                lab_orders=medical_data.get('lab_orders', [])
            )
        else:
            # Fallback processing
            entities = await extract_entities(combined_text)
            billing_code = get_billing_code(entities["diagnosis"])
            
            prescriptions = [
                Prescription(
                    medication=entities["medication"],
                    dosage=entities["dosage"],
                    frequency=entities["frequency"],
                    duration=entities["duration"]
                )
            ]
            
            return ScribeAgentResponse(
                transcription=combined_text,
                soap_note=f"Multi-Document Analysis:\n\n{combined_text}",
                diagnosis=entities["diagnosis"],
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=entities["lab_orders"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing multiple files: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing multiple files: {str(e)}")

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
        # Generate structured medical data using Mastra SOAP agent
        mastra_result = await generate_soap_note(transcript)
        
        # Check if we got structured JSON data from Mastra
        if isinstance(mastra_result, dict):
            # We got structured data - use it directly
            medical_data = mastra_result
            
            # Ensure billing_code is properly formatted
            if 'billing_code' in medical_data and isinstance(medical_data['billing_code'], dict):
                billing_code = BillingCode(
                    code=medical_data['billing_code']['code'],
                    description=medical_data['billing_code']['description']
                )
            else:
                # Fallback billing code
                billing_code = get_billing_code(medical_data.get('diagnosis', 'unspecified condition'))
            
            # Ensure prescriptions are properly formatted
            prescriptions = []
            if 'prescriptions' in medical_data and isinstance(medical_data['prescriptions'], list):
                for rx in medical_data['prescriptions']:
                    if isinstance(rx, dict):
                        prescriptions.append(Prescription(
                            medication=rx.get('medication', 'Not specified'),
                            dosage=rx.get('dosage', 'Not specified'),
                            frequency=rx.get('frequency', 'Not specified'),
                            duration=rx.get('duration', 'Not specified')
                        ))
            
            if not prescriptions:
                prescriptions = [Prescription(
                    medication="Not entered",
                    dosage="Not entered",
                    frequency="Not entered",
                    duration="Not entered"
                )]
            
            # Assemble final response using Mastra data
            final_response = ScribeAgentResponse(
                transcription=medical_data.get('transcription', transcript),
                soap_note=medical_data.get('soap_note', 'SOAP note not generated'),
                diagnosis=medical_data.get('diagnosis', 'Not specified'),
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=medical_data.get('lab_orders', [])
            )
            
        else:
            # We got a SOAP note string - use fallback extraction
            entities = await extract_entities(transcript)
            billing_code = get_billing_code(entities["diagnosis"])
            
            prescriptions = [
                Prescription(
                    medication=entities["medication"],
                    dosage=entities["dosage"],
                    frequency=entities["frequency"],
                    duration=entities["duration"]
                )
            ]
            
            final_response = ScribeAgentResponse(
                transcription=transcript,
                soap_note=str(mastra_result),
                diagnosis=entities["diagnosis"],
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=entities["lab_orders"]
            )
        
        return final_response.dict()
    except Exception as e:
        print(f"Error in final processing: {e}")
        return {"error": str(e)}

async def run_final_processing_with_context(text: str, context_type: str = "general") -> dict:
    """Run final processing on text with additional context information"""
    try:
        # Enhance the text with context information for better SOAP agent processing
        enhanced_text = f"""
Context Type: {context_type}
Text Content: {text}

Please process this text as medical information and generate appropriate SOAP notes, diagnoses, and treatment plans.
"""
        
        # Generate structured medical data using Mastra SOAP agent with enhanced context
        mastra_result = await generate_soap_note(enhanced_text, context_type)
        
        # Check if we got structured JSON data from Mastra
        if isinstance(mastra_result, dict):
            # We got structured data - use it directly
            medical_data = mastra_result
            
            # Ensure billing_code is properly formatted
            if 'billing_code' in medical_data and isinstance(medical_data['billing_code'], dict):
                billing_code = BillingCode(
                    code=medical_data['billing_code']['code'],
                    description=medical_data['billing_code']['description']
                )
            else:
                # Fallback billing code
                billing_code = get_billing_code(medical_data.get('diagnosis', 'unspecified condition'))
            
            # Ensure prescriptions are properly formatted
            prescriptions = []
            if 'prescriptions' in medical_data and isinstance(medical_data['prescriptions'], list):
                for rx in medical_data['prescriptions']:
                    if isinstance(rx, dict):
                        prescriptions.append(Prescription(
                            medication=rx.get('medication', 'Not specified'),
                            dosage=rx.get('dosage', 'Not specified'),
                            frequency=rx.get('frequency', 'Not specified'),
                            duration=rx.get('duration', 'Not specified')
                        ))
            
            if not prescriptions:
                prescriptions = [Prescription(
                    medication="Not entered",
                    dosage="Not entered",
                    frequency="Not entered",
                    duration="Not entered"
                )]
            
            # Assemble final response using Mastra data
            final_response = ScribeAgentResponse(
                transcription=medical_data.get('transcription', text),
                soap_note=medical_data.get('soap_note', 'SOAP note not generated'),
                diagnosis=medical_data.get('diagnosis', 'Not specified'),
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=medical_data.get('lab_orders', [])
            )
            
        else:
            # We got a SOAP note string - use fallback extraction
            entities = await extract_entities(text)
            billing_code = get_billing_code(entities["diagnosis"])
            
            prescriptions = [
                Prescription(
                    medication=entities["medication"],
                    dosage=entities["dosage"],
                    frequency=entities["frequency"],
                    duration=entities["duration"]
                )
            ]
            
            final_response = ScribeAgentResponse(
                transcription=text,
                soap_note=str(mastra_result),
                diagnosis=entities["diagnosis"],
                billing_code=billing_code,
                prescriptions=prescriptions,
                lab_orders=entities["lab_orders"]
            )
        
        return final_response.dict()
    except Exception as e:
        print(f"Error in final processing with context: {e}")
        return {"error": str(e)}

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
            print(f"📋 Prescriptions in medical_data: {medical_data.get('prescriptions', 'NOT FOUND')}")
            print(f"📋 Lab orders in medical_data: {medical_data.get('lab_orders', 'NOT FOUND')}")
            
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
