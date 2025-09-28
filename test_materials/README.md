# ScribeAgent AI - Test Materials

This directory contains comprehensive test materials to validate the ScribeAgent AI functionality after the recent fixes.

## 📁 Test Files

### 1. `sample_medical_notes.txt`
- **Purpose**: Test file upload functionality
- **Content**: Complete medical notes with patient information, vitals, lab results, and treatment plan
- **Usage**: Upload via the "File Upload" feature in the web interface

### 2. `sample_lab_results.txt`
- **Purpose**: Test document processing with lab data
- **Content**: Laboratory report with comprehensive metabolic panel, lipid panel, and HbA1c
- **Usage**: Upload via the "File Upload" feature or copy-paste into text input

### 3. `copy_paste_notes.txt`
- **Purpose**: Quick copy-paste scenarios for testing
- **Content**: 5 different medical scenarios ready for copy-paste
- **Usage**: Copy any scenario and paste into the text input field

## 🧪 Test Scripts

### 1. `test_interaction_script.py`
- **Purpose**: Automated API testing
- **Features**:
  - Tests backend API health
  - Tests text processing with multiple scenarios
  - Tests file upload functionality
  - Tests WebSocket connection
- **Usage**: `python test_materials/test_interaction_script.py`

### 2. `audio_test_script.py`
- **Purpose**: Audio and WebSocket testing
- **Features**:
  - Tests WebSocket connection
  - Tests audio file upload
  - Provides manual testing instructions
- **Usage**: `python test_materials/audio_test_script.py`

## 🚀 Quick Start Testing

### Step 1: Start the Servers
```bash
# Terminal 1 - Backend
cd /Users/shazebwani/Desktop/HackGT12
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd /Users/shazebwani/Desktop/HackGT12
npm run dev
```

### Step 2: Run Automated Tests
```bash
# Run comprehensive API tests
python test_materials/test_interaction_script.py

# Run audio/WebSocket tests
python test_materials/audio_test_script.py
```

### Step 3: Manual Testing
1. Open http://localhost:3002 in your browser
2. Test different input methods:
   - **Text Input**: Copy scenarios from `copy_paste_notes.txt`
   - **File Upload**: Upload `sample_medical_notes.txt` or `sample_lab_results.txt`
   - **Audio Recording**: Use the real-time recording feature

## ✅ Expected Results

After the fixes, you should see:

### For Text Processing:
- ✅ Complete SOAP notes with real extracted information
- ✅ Proper diagnosis extraction (e.g., "Hypertension", "Type 2 Diabetes")
- ✅ Correct ICD-10 billing codes (e.g., "I10", "E11.9")
- ✅ Prescriptions with medication, dosage, frequency, duration
- ✅ Lab orders when mentioned
- ✅ No generic placeholders like "Primary diagnosis" or "ICD-10 code"

### For File Upload:
- ✅ PDF and text files processed correctly
- ✅ Structured medical data extracted from documents
- ✅ Context-aware processing based on file type

### For Audio Recording:
- ✅ Real-time transcription working
- ✅ WebSocket communication stable
- ✅ SOAP note generation from audio transcripts
- ✅ Complete structured medical data returned

## 🔧 Troubleshooting

### If tests fail:
1. **Backend not running**: Check that uvicorn is running on port 8000
2. **Frontend not accessible**: Check that Next.js is running (likely on port 3002)
3. **Mastra agent errors**: Ensure Node.js dependencies are installed in `/mastra` directory
4. **API timeouts**: Check that OpenAI API key is properly configured

### Common Issues:
- **Port conflicts**: Frontend may run on 3001 or 3002 if 3000 is occupied
- **CORS errors**: Backend should allow all origins in development
- **Missing dependencies**: Run `npm install` in both root and `/mastra` directories

## 📊 Test Scenarios

The test materials include these medical scenarios:

1. **Hypertension Follow-up**: Simple medication management
2. **Diabetes Management**: Complex medication adjustment
3. **Chest Pain Evaluation**: Emergency presentation with multiple medications
4. **Routine Physical**: Preventive care with lab orders
5. **Respiratory Infection**: Common illness with symptomatic treatment

Each scenario tests different aspects of the SOAP note generation and medical data extraction.

## 🎯 Success Criteria

The fixes are working correctly if:
- [ ] All automated tests pass
- [ ] SOAP notes contain real medical information (not placeholders)
- [ ] Prescriptions are properly extracted and formatted
- [ ] Billing codes are accurate ICD-10 codes
- [ ] File uploads process correctly
- [ ] Audio recording generates complete medical documentation
- [ ] Frontend displays all data properly in the ResultsCard component
