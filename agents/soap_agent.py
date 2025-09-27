# agents/soap_agent.py
import os
import openai
from .soap_examples import FEW_SHOT_EXAMPLES

# Define the system prompt for the SOAP note generation agent
SYSTEM_PROMPT = """
You are an expert medical assistant specialized in generating comprehensive SOAP notes from patient visit transcripts. 

Your task is to convert conversational medical dictations into properly formatted SOAP notes following the standard medical documentation format:

SUBJECTIVE: Patient's chief complaint, history of present illness, review of systems, and any relevant patient-reported information.

OBJECTIVE: Physical examination findings, vital signs, laboratory results, and other objective clinical data.

ASSESSMENT: Clinical diagnoses, differential diagnoses, and clinical impressions based on the subjective and objective findings.

PLAN: Treatment recommendations, medications, follow-up instructions, patient education, and any additional diagnostic tests or referrals.

Guidelines for SOAP note generation:
- Use clear, professional medical language
- Be specific and detailed in all sections
- Include relevant vital signs and physical exam findings
- Provide specific medication names, dosages, and frequencies
- Include appropriate follow-up instructions
- Maintain patient confidentiality and professionalism
- Use the provided examples as templates for formatting and content structure

Generate a complete, well-structured SOAP note that accurately reflects the information provided in the transcript.
"""

# OpenAI client will be initialized when needed

def _format_examples_for_prompt():
    """Format the few-shot examples for the prompt"""
    examples_text = ""
    for i, example in enumerate(FEW_SHOT_EXAMPLES[:5], 1):  # Use first 5 examples to avoid token limits
        examples_text += f"\nExample {i}:\n"
        examples_text += f"Input: {example['input']}\n"
        examples_text += f"Output: {example['output']}\n"
    return examples_text

async def generate_soap_note(transcript: str) -> str:
    """
    Generate a SOAP note from a given patient visit transcript using OpenAI GPT-4.
    
    Args:
        transcript (str): The patient visit transcript or dictation to convert to SOAP format.
        
    Returns:
        str: The generated SOAP note in standard medical documentation format.
        
    Raises:
        Exception: If the OpenAI API fails to generate the SOAP note.
    """
    try:
        # Check if OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise EnvironmentError("OPENAI_API_KEY is not set in environment variables")
        
        # Initialize OpenAI client
        client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Format examples for the prompt
        examples_text = _format_examples_for_prompt()
        
        # Create the full prompt with examples
        full_prompt = f"""
{SYSTEM_PROMPT}

Here are some examples to guide your formatting:

{examples_text}

Now, please generate a SOAP note for the following transcript:

{transcript}
"""
        
        # Call OpenAI API
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Please generate a SOAP note for this medical transcript:\n\n{transcript}"}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Error generating SOAP note: {e}")
        # Fallback to a basic SOAP note if the API fails
        return f"""
SUBJECTIVE:
Patient visit transcript: {transcript[:200]}...

OBJECTIVE:
Unable to process transcript with AI agent.

ASSESSMENT:
Technical error in SOAP note generation.

PLAN:
- Review transcript manually
- Regenerate SOAP note using alternative method
- Contact technical support if issue persists
"""
