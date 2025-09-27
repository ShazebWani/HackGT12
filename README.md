# ScribeAgent AI - Full-Stack Medical Transcription Platform

A complete AI-powered medical transcription application with a **FastAPI backend** and **Next.js frontend**. This platform processes audio files of medical dictations and returns structured clinical data including transcriptions, SOAP notes, billing codes, and prescriptions.

## 🌟 Features

- **🎙️ Real-time Audio Streaming**: Live transcription with WebSocket communication
- **📁 File Upload**: Traditional audio file processing 
- **🏥 Medical Intelligence**: Automatic SOAP note generation
- **💰 Billing Integration**: Real-time ICD-10 code lookup
- **💊 Prescription Management**: Structured medication extraction
- **🔬 Lab Orders**: Automated test ordering
- **⚡ Professional UI**: Medical-themed, responsive interface

## 🚀 Quick Start

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

### 3. Install Frontend Dependencies
```bash
npm install
```

### 4. Start the Frontend Server
```bash
npm run dev
```

The web app will be available at `http://localhost:3000`

### 5. Test the Full Application

**Option 1: Use the Web Interface**
- Go to `http://localhost:3000`
- Choose "Real-time Streaming" or "File Upload" mode
- Test the live transcription or upload an audio file

**Option 2: Test APIs Directly**

Traditional HTTP endpoint:
```bash
python test_api.py
```

WebSocket streaming endpoint:
```bash
python test_websocket.py
```

## 📡 API Endpoints

### 🔄 WebSocket `/ws/process-visit` (NEW!)

**Real-time audio streaming endpoint for live transcription**

**Connection:** `ws://localhost:8000/ws/process-visit`

**Message Flow:**
1. **Client → Server:** Binary audio chunks (bytes)
2. **Server → Client:** Partial transcription updates
   ```json
   {
     "type": "partial_transcript",
     "text": "Patient is a 34-year-old...",
     "is_final": false
   }
   ```
3. **Client → Server:** `"END_OF_STREAM"` (text message)
4. **Server → Client:** Final structured result
   ```json
   {
     "type": "final_result",
     "data": {
       "transcription": "Patient is a 34-year-old male presenting with...",
       "soap_note": "SUBJECTIVE:\n34-year-old male presents with...",
       "diagnosis": "streptococcal pharyngitis",
       "billing_code": {
         "code": "J02.0",
         "description": "streptococcal pharyngitis"
       },
       "prescriptions": [...],
       "lab_orders": [...]
     }
   }
   ```

### POST `/api/process-visit`

**Traditional file upload endpoint (fallback)**

Accepts an audio file upload and returns structured medical data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file (any format)

**Response:** Same structure as WebSocket final result data

### GET `/`

Health check endpoint that returns a simple status message.

## 🏗️ Project Structure

```
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── data/
│   └── icd10_codes.csv # ICD-10 billing codes database
├── test_api.py          # HTTP API testing script
├── test_websocket.py    # WebSocket streaming test script
└── README.md           # This file
```

## 🔧 Current Implementation

### Mock AI Components
- **Speech-to-Text**: Returns hardcoded transcription
- **Entity Extraction**: Extracts diagnosis, medication, dosage, etc.
- **SOAP Note Generation**: Creates structured clinical notes

### Real Components
- **Billing Code Lookup**: Real CSV-based ICD-10 code lookup
- **File Upload Handling**: Proper multipart/form-data processing
- **WebSocket Streaming**: Real-time bidirectional communication
- **Concurrent Processing**: Async audio streaming with concurrent transcription
- **CORS Support**: Enabled for frontend development

## 🚀 Deployment Ready

This backend is ready for deployment to services like:
- **Render** (recommended for hackathons)
- **Google Cloud Run**
- **Heroku**
- **AWS Lambda** (with minor modifications)

## 🔄 Next Steps

To integrate real AI services, replace the mock functions in `main.py`:

1. **transcribe_audio_mock()** → OpenAI Whisper API
2. **extract_entities_mock()** → LLM API call with NER prompt
3. **generate_soap_note_mock()** → LLM API call with SOAP generation prompt

## 📊 Performance

- **Response Time**: ~500ms (with mocks)
- **File Upload**: Supports any audio format
- **Billing Lookup**: Fast in-memory CSV lookup
- **CORS**: Configured for frontend development

## 🛡️ Error Handling

- File upload validation
- Graceful CSV loading with fallbacks
- Billing code lookup with default responses
- Proper HTTP status codes
