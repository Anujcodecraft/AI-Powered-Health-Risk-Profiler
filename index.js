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



async function getLLMRecommendations(factors) {
    if (factors.length === 0) return ["Maintain your healthy lifestyle habits."];
    const prompt = `Based on the following health risk factors: ${factors.join(', ')}. Generate a JSON array of 3 short, actionable, non-diagnostic wellness tips. The tone should be encouraging and general. Do not give medical advice. Example format: ["Tip 1 text.", "Tip 2 text.", "Tip 3 text."]. JSON:`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error calling LLM:", error);
        return ["Focus on a balanced diet and regular exercise for better health."];
    }
}


async function analyzeHealthData(answers) {
    const factors = [];
    let score = 0;
    if (answers.smoker) factors.push("smoking");
    if (answers.exercise === 'rarely' || answers.exercise === 'never') factors.push("low exercise");
    if (answers.diet === 'high sugar' || answers.diet === 'high fat') factors.push("poor diet");
    if (answers.age > 50) factors.push("age over 50");
    if (factors.includes("smoking")) score += 30;
    if (factors.includes("low exercise")) score += 20;
    if (factors.includes("poor diet")) score += 25;
    if (factors.includes("age over 50")) score += 10;
    let riskLevel = 'low';
    if (score >= 50) riskLevel = 'high';
    else if (score >= 25) riskLevel = 'medium';

    const recommendations = await getLLMRecommendations(factors);
    return { risk_level: riskLevel, factors: factors, recommendations: recommendations, status: "ok" };
}

//     this is the parsing function

function parseSurveyText(text) {
    let trimmedText = text.trim();
    let answers = {};

    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
        console.log("ynha hun m.");
        try {
            
            let cleanedText = trimmedText.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); 
            cleanedText = cleanedText.replace(/:\s*([a-zA-Z0-9_]+)\s*([,}])/g, ':"$1"$2');
            
            console.log("Cleaned Text for Parsing:", cleanedText); 
            
            answers = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse OCR text as JSON, it might be malformed.", e);
            return {};
        }
    } else {
        console.log("Dsecond ynha.");
        const regex = /^([^:]+):\s*(.+)$/gm;
        let match;
        while ((match = regex.exec(trimmedText)) !== null) {
            const key = match[1].trim().toLowerCase();
            let value = match[2].trim().toLowerCase();
            if (EXPECTED_FIELDS.includes(key)) {
                if (key === 'age') value = parseInt(value, 10) || null;
                else if (key === 'smoker' || key === 'alcoholic') value = (value === 'yes' || value === 'true');
                answers[key] = value;
            }
        }
    }
    
    console.log( answers);
    return answers;
}


function processAnswers(answers) {
    const missingFields = EXPECTED_FIELDS.filter(field => !answers.hasOwnProperty(field));
    if (missingFields.length > EXPECTED_FIELDS.length / 2) {
        return { status: "incomplete_profile", reason: `>50% fields missing. Missing: ${missingFields.join(', ')}` };
    }

    return { status: "ok", data: answers };
}





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