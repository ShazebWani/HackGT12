# SOAP Note Generation Agent

This directory contains the SOAP Note Generation Agent built with OpenAI's GPT-3.5-turbo for the ScribeAgent AI Backend.

## Overview

The SOAP Note Generation Agent converts patient visit transcripts into properly formatted SOAP (Subjective, Objective, Assessment, Plan) notes using advanced AI with few-shot learning examples.

## Files

- `__init__.py` - Package initialization file
- `soap_examples.py` - Contains 15 high-quality few-shot examples for training the agent
- `soap_agent.py` - Main agent implementation using OpenAI GPT-3.5-turbo
- `README.md` - This documentation file

## Features

- **Few-Shot Learning**: Uses 15 diverse medical examples to guide SOAP note generation
- **Professional Formatting**: Generates properly structured SOAP notes following medical standards
- **Error Handling**: Includes fallback mechanisms for robust operation
- **Async Support**: Fully asynchronous implementation for FastAPI integration

## Usage

### Basic Usage

```python
from agents.soap_agent import generate_soap_note

# Generate a SOAP note from a transcript
transcript = "Patient is a 45-year-old male with hypertension..."
soap_note = await generate_soap_note(transcript)
print(soap_note)
```

### Integration with FastAPI

The agent is already integrated into the main FastAPI backend in `main.py`. It's used in both:

1. **HTTP Endpoint**: `/api/process-visit` - Processes audio uploads
2. **WebSocket Endpoint**: `/ws/process-visit` - Handles real-time audio streaming

## Requirements

- `openai` - For GPT-3.5-turbo model access
- `OPENAI_API_KEY` environment variable

## Testing

Run the test script to verify the agent works correctly:

```bash
python test_soap_agent.py
```

Make sure you have your `OPENAI_API_KEY` set in your environment or `.env` file.

## SOAP Note Format

The agent generates SOAP notes in the following format:

```
SUBJECTIVE:
[Patient's chief complaint, history, and symptoms]

OBJECTIVE:
[Physical exam findings, vital signs, lab results]

ASSESSMENT:
[Clinical diagnoses and impressions]

PLAN:
[Treatment recommendations, medications, follow-up]
```

## Examples

The agent is trained on 15 diverse medical scenarios including:

- Hypertension follow-up
- Streptococcal pharyngitis
- Type 2 diabetes management
- Asthma exacerbation
- Urinary tract infection
- Depression management
- Low back pain
- Atopic dermatitis
- Prenatal care
- Heart failure
- Cellulitis
- Migraine management
- COPD exacerbation
- Hypothyroidism
- Ankle sprain
- GERD management

## Error Handling

If the agent fails to generate a SOAP note, it will:

1. Log the error for debugging
2. Return a fallback SOAP note with error information
3. Provide guidance for manual review

## Contributing

To add new examples or improve the agent:

1. Add new examples to `soap_examples.py`
2. Update the system prompt in `soap_agent.py` if needed
3. Test with the provided test script
4. Ensure all examples follow the same format and quality standards
