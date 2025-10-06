const express = require('express');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3002;

app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

const EXPECTED_FIELDS = ['age', 'smoker', 'exercise', 'diet'];




app.post('/api/profile', upload.single('image'), async (req, res) => {
    console.log('\n--- NEW REQUEST RECEIVED ---');
    let answers;

    if (req.is('json')) {
        console.log('[Step 1] Input type is JSON.');
        answers = req.body;
    } else {
        let rawText = '';
        if (req.body.text) {
            console.log('[Step 1] Input type is Text.');
            rawText = req.body.text;
        } else if (req.file) {
            console.log('[Step 1] Input type is Image. Running OCR...');
            try {
                const worker = await createWorker('eng');
                const ret = await worker.recognize(req.file.buffer);
                rawText = ret.data.text.trim();
                await worker.terminate();
            } catch (error) { 
                console.error('OCR Error:', error);
                return res.status(500).json({ status: "ocr_failed", message: error.message }); 
            }
        } else { 
            return res.status(400).json({ status: "error", message: "Please provide survey data." }); 
        }

        console.log('--- OCR Raw Output ---');
        console.log(rawText);
        console.log('----------------------');
        
        console.log('[Step 2] Parsing the extracted text...');
        answers = parseSurveyText(rawText);
    }
    
    console.log('--- Parsed Answers Object ---');
    console.log(answers);
    console.log('---------------------------');
    
    console.log('[Step 3] Processing answers and checking guardrails...');
    const processed = processAnswers(answers);

    console.log('--- Processed Object (after guardrail) ---');
    console.log(processed);
    console.log('------------------------------------------');
    
    if (processed.status !== 'ok') {
        console.log('[FAIL] Guardrail triggered. Sending 400 Bad Request.');
        return res.status(400).json(processed);
    }
    
    console.log('[Step 4] Analyzing data and generating recommendations...');
    const finalProfile = await analyzeHealthData(processed.data);

    console.log('--- Final Profile (before sending response) ---');
    console.log(finalProfile);
    console.log('-----------------------------------------------');
    
    res.json(finalProfile);
});

app.listen(PORT, () => {
    console.log(`Health Profiler Server is running on http://localhost:${PORT}`);
});