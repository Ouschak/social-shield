# CreatorShield

CreatorShield is a project for detecting and moderating hate speech on social media (targeting Instagram). It uses a local AI model and a Chrome Extension.

## Quick Start

Follow these exact commands to set up and run the project.

### 1. Environment Setup

First, create a virtual environment and install dependencies (CPU-optimized).

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare AI Models

Download the required local models.

```bash
cd Gen_AI/downloading_models
python download_model.py
cd ../..
```

### 3. Start the Backend

Run the FastAPI server.

```bash
cd backend
uvicorn app.main:app --reload
```

The backend will start at `http://localhost:8000`.

### 4. Setup Chrome Extension

Open a new terminal window for the extension.

```bash
cd extension
pnpm install
pnpm build
```

**To load into Chrome:**
1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension/dist` folder.
