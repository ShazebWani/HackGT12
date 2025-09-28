# ScribeAgent AI Backend - Streaming Implementation

## Overview

This is the real-time streaming backend for ScribeAgent AI, built with FastAPI and OpenAI Whisper. It provides live speech-to-text transcription via WebSocket connections and processes the results through downstream AI analysis.

## Features

- **Real-time Audio Streaming**: WebSocket endpoint accepts live audio streams
- **Live Transcription**: Uses OpenAI Whisper API for speech-to-text
- **Database Persistence**: Saves final transcripts to SQLite database
- **AI Processing**: Extracts entities, generates SOAP notes, and looks up billing codes
- **Secure Configuration**: API keys stored in environment variables

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="sqlite:///./transcripts.db"
```

**Note**: The application now uses local audio transcription via OpenAI Whisper instead of external services.

### 3. Start the Server

```bash
python start_server.py
```

Or manually:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test the WebSocket

```bash
python test_websocket_streaming.py
```

## API Endpoints

### WebSocket: `/ws/process-visit`

**Purpose**: Real-time audio streaming and transcription

**Connection**: `ws://localhost:8000/ws/process-visit`

**Message Flow**:
1. Client connects to WebSocket
2. Client sends audio data as binary messages
3. Server streams partial transcripts back in real-time
4. When transcription is complete, server processes the final transcript
5. Server sends final structured result

**Message Types**:

**From Client**:
- Binary audio data (raw audio bytes)

**From Server**:
```json
{
  "type": "partial_transcript",
  "text": "Patient is a 34-year-old...",
  "is_final": false
}
```

```json
{
  "type": "final_result",
  "data": {
    "transcription": "Complete transcript...",
    "soap_note": "SOAP note...",
    "diagnosis": "diagnosis",
    "billing_code": {
      "code": "J02.0",
      "description": "Acute pharyngitis"
    },
    "prescriptions": [...],
    "lab_orders": [...]
  }
}
```

```json
{
  "type": "error",
  "message": "Error description"
}
```

### REST API: `/api/process-visit`

**Purpose**: File upload processing (legacy endpoint)

**Method**: POST

**Body**: Multipart form with audio file

**Response**: Complete structured medical data

## Database Schema

The SQLite database contains a `transcripts` table:

```sql
CREATE TABLE transcripts (
    id INTEGER PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    full_text TEXT
);
```

## Architecture

```
Frontend (WebSocket Client)
    ↓ (audio stream)
WebSocket Endpoint (/ws/process-visit)
    ↓ (audio data)
OpenAI Whisper API
    ↓ (transcript)
WebSocket Endpoint
    ↓ (final transcript)
Database (SQLite)
    ↓ (final transcript)
AI Processing Pipeline
    ↓ (structured data)
WebSocket Client
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for SOAP note generation)
- `DATABASE_URL`: SQLite database URL (default: `sqlite:///./transcripts.db`)

### OpenAI Whisper Configuration

- Model: gpt-4o-transcribe
- Language: English (forced)
- Real-time processing enabled
- Automatic punctuation and formatting

## Error Handling

The WebSocket endpoint includes comprehensive error handling:

- **Connection Errors**: Graceful WebSocket disconnection handling
- **OpenAI Whisper Errors**: Transcription service error propagation
- **Database Errors**: Transaction rollback and error logging
- **Processing Errors**: Downstream AI processing error handling

## Development

### File Structure

```
├── main.py                 # Main FastAPI application
├── database.py            # Database configuration and models
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in git)
├── start_server.py        # Server startup script
├── test_websocket_streaming.py  # WebSocket test script
└── transcripts.db         # SQLite database (created automatically)
```

### Testing

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test WebSocket communication
3. **End-to-End Tests**: Test complete audio-to-result flow

### Debugging

Enable debug logging by setting the log level:

```bash
uvicorn main:app --reload --log-level debug
```

## Security Considerations

- ✅ API keys stored in environment variables
- ✅ `.env` file excluded from version control
- ✅ CORS configured for development
- ⚠️ Production deployment should use proper CORS settings
- ⚠️ Consider rate limiting for production use

## Performance Notes

- **Concurrent Connections**: FastAPI supports multiple WebSocket connections
- **Memory Usage**: Audio data is streamed, not buffered
- **Database**: SQLite suitable for development; consider PostgreSQL for production
- **OpenAI Whisper**: Check rate limits and pricing for production usage

## Troubleshooting

### Common Issues

1. **"OpenAI API key not set"**
   - Check your `.env` file
   - Ensure `OPENAI_API_KEY` is set correctly

2. **WebSocket connection fails**
   - Check if server is running on port 8000
   - Verify WebSocket URL: `ws://localhost:8000/ws/transcription`

3. **Database errors**
   - Check if `transcripts.db` file is writable
   - Verify `DATABASE_URL` in `.env` file

4. **Audio not transcribing**
   - Ensure audio is in correct format (16kHz sample rate)
   - Check OpenAI API key and quota

### Logs

The server provides detailed logging for debugging:

- WebSocket connection events
- Audio processing status
- Transcription results
- Database operations
- Error messages

## Next Steps

1. **Frontend Integration**: Connect the React frontend to the WebSocket
2. **Audio Format Validation**: Add audio format checking
3. **Authentication**: Add user authentication for production
4. **Monitoring**: Add health checks and metrics
5. **Scaling**: Consider Redis for session management in production
