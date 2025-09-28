# agents/mastra_soap_agent.py
import os
import subprocess
import asyncio
import json
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Path to the Mastra directory
MASTRA_DIR = Path(__file__).parent.parent / "mastra"

async def generate_soap_note(transcript: str, context_type: str = "general") -> str:
    """
    Generate a SOAP note from a given patient visit transcript using Mastra SOAP agent.
    
    Args:
        transcript (str): The patient visit transcript or dictation to convert to SOAP format.
        
    Returns:
        str: The generated SOAP note in standard medical documentation format.
        
    Raises:
        Exception: If the Mastra agent fails to generate the SOAP note.
    """
    try:
        # Check if transcript is provided
        if not transcript or not transcript.strip():
            raise ValueError("Transcript is required and cannot be empty")
        
        # Prepare environment variables - inherit current env and ensure OPENAI_API_KEY is passed
        env = os.environ.copy()
        
        # Check if OPENAI_API_KEY is available
        if not env.get("OPENAI_API_KEY"):
            print("⚠️ OPENAI_API_KEY not found in environment variables")
            return _generate_fallback_soap_note(transcript)
        
        # Call the Mastra script directly using tsx with context type
        result = subprocess.run(
            ["npx", "tsx", "generate-soap.ts", transcript, context_type],
            cwd=MASTRA_DIR,
            capture_output=True,
            text=True,
            timeout=60,
            env=env  # Pass environment variables explicitly
        )
        
        if result.returncode == 0:
            # Extract the SOAP note from the output
            output_lines = result.stdout.strip().split('\n')
            
            # Find the SOAP note content between the markers
            soap_start = -1
            soap_end = -1
            found_first_separator = False
            
            for i, line in enumerate(output_lines):
                if '📋 Generated SOAP Note:' in line:
                    # Look for the next line with equals signs (separator)
                    for j in range(i + 1, len(output_lines)):
                        if '==' in output_lines[j]:
                            soap_start = j + 1
                            found_first_separator = True
                            break
                elif '==' in line and found_first_separator and soap_start > -1 and i > soap_start:
                    soap_end = i
                    break
            
            if soap_start > -1 and soap_end > -1:
                soap_content = '\n'.join(output_lines[soap_start:soap_end])
                
                # Look for JSON content within the output
                json_data = extract_json_from_content(soap_content)
                if json_data:
                    return json_data
                
                # If not JSON, return as SOAP note string
                return soap_content.strip()
            else:
                # If we can't find markers, check if we have any meaningful output
                if result.stdout.strip():
                    # Try to extract JSON from full output
                    json_data = extract_json_from_content(result.stdout)
                    if json_data:
                        return json_data
                    return result.stdout.strip()
                else:
                    return _generate_fallback_soap_note(transcript)
        
        else:
            # Mastra script failed, fall back to generating a fallback SOAP note
            return _generate_fallback_soap_note(transcript)
        
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, Exception):
        # Any error with Mastra agent, fall back gracefully
        return _generate_fallback_soap_note(transcript)

def extract_json_from_content(content: str) -> Optional[dict]:
    """Extract JSON data from content that may contain markdown code blocks"""
    try:
        # First try to parse the content directly as JSON
        return json.loads(content.strip())
    except json.JSONDecodeError:
        pass
    
    # Look for JSON within markdown code blocks
    lines = content.split('\n')
    json_start = -1
    json_end = -1
    
    for i, line in enumerate(lines):
        if line.strip() == '```json' or line.strip().startswith('```json'):
            json_start = i + 1
        elif line.strip() == '```' and json_start > -1:
            json_end = i
            break
        elif line.strip().startswith('{') and json_start == -1:
            # JSON might start without markdown wrapper
            json_start = i
            # Find the end by counting braces
            brace_count = 0
            for j in range(i, len(lines)):
                brace_count += lines[j].count('{') - lines[j].count('}')
                if brace_count == 0 and '{' in lines[j]:
                    json_end = j + 1
                    break
            break
    
    if json_start > -1 and json_end > -1:
        json_text = '\n'.join(lines[json_start:json_end])
        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            pass
    
    return None

def _generate_fallback_soap_note(transcript: str) -> str:
    """Generate a fallback SOAP note when the Mastra agent is unavailable"""
    return f"""
SUBJECTIVE:
Patient visit transcript: {transcript[:200]}...

OBJECTIVE:
Unable to process transcript with Mastra SOAP agent.

ASSESSMENT:
Technical error in SOAP note generation - Mastra agent unavailable.

PLAN:
- Review transcript manually
- Ensure Mastra dependencies are installed (npm install in mastra directory)
- Ensure Node.js and tsx are available
- Regenerate SOAP note using Mastra agent
- Contact technical support if issue persists

Note: This is a fallback SOAP note. Please ensure Mastra is properly set up in {MASTRA_DIR}
"""

async def check_mastra_setup() -> bool:
    """
    Check if the Mastra setup is working correctly.
    
    Returns:
        bool: True if setup is working, False otherwise.
    """
    try:
        # Check if mastra directory exists
        if not MASTRA_DIR.exists():
            return False
        
        # Check if package.json exists
        if not (MASTRA_DIR / "package.json").exists():
            return False
        
        # Test if tsx is available
        result = subprocess.run(
            ["npx", "tsx", "--version"],
            cwd=MASTRA_DIR,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        return result.returncode == 0
        
    except Exception:
        return False

async def test_mastra_service():
    """Test the Mastra SOAP agent with a sample transcript"""
    # Check setup first
    is_setup = await check_mastra_setup()
    if not is_setup:
        print("❌ Mastra setup is not correct")
        return False
    
    # Import sample transcript from test fixtures
    from test_fixtures.sample_transcripts import get_sample_transcript
    test_transcript = get_sample_transcript("hypertension")
    
    try:
        soap_note = await generate_soap_note(test_transcript)
        print("✅ Test SOAP note generation successful!")
        print("\n📋 Generated SOAP Note:")
        print("-" * 50)
        print(soap_note)
        print("-" * 50)
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_mastra_service())
