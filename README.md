# 🧠 AI-Powered Health Risk Profiler

**An intelligent health profiling backend powered by OCR (Tesseract.js) and Google Gemini AI.**
This system extracts health survey information from text or image inputs, analyzes risk factors, and generates personalized, non-diagnostic wellness recommendations.

---

## 🚀 Features

* OCR-based survey extraction from uploaded images
* Smart text parsing for both structured (JSON) and unstructured input
* Dynamic health risk scoring system
* Contextual recommendations via **Google Gemini AI**
* Input guardrails to validate completeness and prevent malformed data
* Simple REST API (Express.js) for easy frontend or mobile integration

---

## 🧩 Tech Stack

* **Node.js** + **Express.js** — REST API server
* **Multer** — handles file uploads (memory storage)
* **Tesseract.js** — OCR extraction from images
* **Google Generative AI SDK (Gemini)** — generates actionable wellness tips
* **dotenv** — for environment variable management
* **MongoDB** *(planned)* — future integration for user data persistence

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Anujcodecraft/AI-Powered-Health-Risk-Profiler.git
cd health-profiler-backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Add environment variables

Create a `.env` file in the root directory:

```
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4️⃣ Run the server

```bash
node index.js
```

The server will start at:
👉 **[http://localhost:3002](http://localhost:3002)**

---

## 🔗 API Endpoints

### **POST /api/profile**

Analyze health data from JSON, text, or image input.

#### ✅ Supported Input Types

| Type  | Content-Type                      | Description                                                      |
| ----- | --------------------------------- | ---------------------------------------------------------------- |
| JSON  | `application/json`                | Directly send health survey data                                 |
| Text  | `text/plain` or body param `text` | Raw text with key-value pairs                                    |
| Image | `multipart/form-data`             | Upload an image containing handwritten or printed survey answers |

---

### 🧪 Sample Requests

#### 📘 1. JSON Input

```bash
curl -X POST http://localhost:3002/api/profile \
  -H "Content-Type: application/json" \
  -d '{"age": 45, "smoker": true, "exercise": "rarely", "diet": "high fat"}'
```

#### 📗 2. Text Input

```bash
curl -X POST http://localhost:3002/api/profile \
  -H "Content-Type: application/json" \
  -d '{"text": "Age: 45\nSmoker: yes\nExercise: rarely\nDiet: high fat"}'
```

#### 📙 3. Image Upload

```bash
curl -X POST http://localhost:3002/api/profile \
  -F "image=@survey_form.jpg"
```

---

### 🧾 Sample JSON Response

```json
{
  "risk_level": "medium",
  "factors": ["smoking", "low exercise", "poor diet"],
  "recommendations": [
    "Try a daily 30-minute walk to boost cardiovascular health.",
    "Incorporate more fruits and vegetables into your diet.",
    "Set small weekly goals to gradually reduce smoking."
  ],
  "status": "ok"
}
```

---

## 🧮 Architecture & Data Flow

**High-level workflow:**

1. **Input Handling**

   * Accepts JSON, plain text, or an image file.
2. **OCR Processing**

   * If an image is uploaded, `tesseract.js` extracts text using `eng.traineddata`.
3. **Parsing Layer**

   * Extracts key-value pairs for: `age`, `smoker`, `exercise`, and `diet`.
   * Auto-detects malformed JSON and attempts cleanup.
4. **Guardrails**

   * Checks if at least 50% of required fields are present.
5. **Health Analysis**

   * Calculates a risk score based on lifestyle patterns.
6. **LLM Integration**

   * Sends the detected risk factors to **Google Gemini AI** with a structured prompt.
   * Generates JSON-formatted wellness tips.
7. **Response**

   * Returns `risk_level`, identified `factors`, and `recommendations`.


   <img width="918" height="614" alt="image" src="https://github.com/user-attachments/assets/81754784-8d94-4bb7-9484-7aac13fbd7ea" />


---

## 🤖 Gemini Prompt & Refinement Logic

Prompt sent to Gemini:

```
Based on the following health risk factors: [factors].
Generate a JSON array of 3 short, actionable, non-diagnostic wellness tips.
The tone should be encouraging and general. 
Do not give medical advice. 
Example format: ["Tip 1 text.", "Tip 2 text.", "Tip 3 text."]. 
JSON:
```

Refinements:

* Trimmed Markdown artifacts like ```json fences.
* Added guardrails for empty or invalid responses.
* Fallback tip: *"Focus on a balanced diet and regular exercise for better health."*

---

## 🧠 Design Choices & State Handling

* **Stateless API:** Each request is independent — no session/state stored on the server.
* **Memory-based file handling:** Uploaded files are processed in-memory (no disk writes).
* **Data validation:** Only four key fields (`age`, `smoker`, `exercise`, `diet`) are accepted.
* **LLM response sanitation:** Ensures valid JSON even if the model outputs Markdown formatting.

---

<img width="1820" height="882" alt="image" src="https://github.com/user-attachments/assets/c40ea282-1705-4b85-a96f-45e32ffc16b4" />

<img width="1823" height="744" alt="image" src="https://github.com/user-attachments/assets/9ebc64fa-e732-430f-a1cf-745cf7d79f1f" />

<img width="1911" height="901" alt="image" src="https://github.com/user-attachments/assets/a78294e8-d950-481b-ad3e-7d3a80a8545d" />




---

## ⚠️ Known Issues

* OCR accuracy may drop for handwritten forms or poor lighting.
* Gemini output may occasionally contain invalid JSON requiring cleanup.
* Currently no persistent database — responses are ephemeral.

---

## 🚧 Future Improvements

* ✅ Add MongoDB integration to store past profiles
* ✅ Include health trend analysis over time
* ✅ Build a React-based dashboard frontend
* ✅ Improve OCR with custom-trained models
* ✅ Add authentication and user history

---

## 👨‍💻 Author

**Anuj Gautam**
final year CSE @ MANIT Bhopal
Technical Head @ Vision NIT Bhopal


---
