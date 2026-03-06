# Social Shield

Social Shield is a privacy-first browser extension and locally-hosted backend designed to make social media safer by intercepting and filtering comments in real-time. It provides tailored filtering strategies: from catching explicit profanity, to identifying passive-aggressive "soft harassment" that platforms often ignore.

## What We Did

We built a real-time comment moderation system that consists of two main components:
1. **JavaScript Browser Extension:** Intercepts DOM changes in real-time to analyze incoming and outgoing comments. 
2. **Python / FastAPI Backend:** A dedicated local ASGI server (running 4 workers) that orchestrates low-latency decision logic and serves our local AI models.

To balance speed, accuracy, and cost, we designed a **4-Layer Protection Cascade**:
- **Stage 0 (Keyword Filter):** Instantly filters user-defined specific words (<1ms).
- **Stage 1 (Local Guard):** Instantly catches general profanity and explicit hate, including typos.
- **Stage 2 (Cloud Moderator):** Checks for severe toxicity using a fallback to the OpenAI Moderation API.
- **Stage 3 (Context Engine):** Safeguards creators from subtle, passive-aggressive soft harassment using contextual few-shot contrastive learning.

The architecture is entirely stateless. We do not store or sell user data; text is discarded the moment it is evaluated.

## What Models We Used

Our pipeline uses the following models:
- **Stage 1 (Explicit Hate):** Fine-tuned `s-nlp/roberta_toxicity_classifier` (RoBERTa-Large). This model handles immediate recognition of general hate speech and typical toxicity.
- **Stage 2 (Severe Toxicity):** **OpenAI Omni-Moderation API**, which is a highly reliable cloud fallback that runs in ~160ms.
- **Stage 3 (Soft Harassment):** **SetFit** model (`all-MiniLM-L12-v2`). We fine-tuned this lightweight sentence transformer using a few-shot contrastive learning framework to detect subtle, passive-aggressive behavior in ~200ms.

## What We Found (Benchmarks)

We validated our architecture against real-world test sets (e.g., Instagram comments) and found:
*   **Explicit Hate (Stage 1 & 2):** We caught up to **98%** of explicit hate using our fine-tuned RoBERTa-Large model combined with OpenAI’s Moderation API.
*   **Soft Harassment (Stage 3):** We achieved **~86% recall** on detecting subtle harassment in our benchmarks using the SetFit model.

The combination of a small localized model (SetFit) and a larger contextual classification model (RoBERTa) allowed us to achieve high accuracy for nuanced moderation while maintaining low inference latency.

---

## How to Launch the Extension

Follow these steps to set up and run the Social Shield environment locally:

### 1. Environment & AI Models Setup
First, prepare your Python virtual environment and download the necessary AI models:

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download required local models
cd Gen_AI/downloading_models
python download_model.py
cd ../..
```

### 2. Start the Backend Server
Run the FastAPI backend which orchestrates the local AI models.

```bash
cd backend
uvicorn app.main:app --reload
```
The backend will start at `http://localhost:8000`.

### 3. Build & Load the Chrome Extension
Open a new terminal window to build the browser extension:

```bash
cd extension
npm install
npm run build
```

**To load it into Chrome:**
1. Open your browser and navigate to `chrome://extensions`.
2. Enable the **Developer mode** toggle in the top right corner.
3. Click **Load unpacked**.
4. Select the `extension/dist` folder from this project directory.
