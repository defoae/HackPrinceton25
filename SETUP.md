# 🚀 Running SlopGuard Locally

This guide will help you run both the backend and frontend locally.

## Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 18+** (for frontend)
- **TensorFlow** and model files (should already be in the project)

## Step 1: Backend Setup (Flask)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify the model file exists:**
   Make sure the model file is at:
   ```
   backend/models/ai_detector_model.keras
   ```

5. **Start the Flask server:**
   ```bash
   cd src
   python server.py
   ```
   
   The backend will run on **http://127.0.0.1:5000**

## Step 2: Frontend Setup (Next.js)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will run on **http://localhost:3000**

## Step 3: Test It Out! 🎉

1. Open your browser and go to **http://localhost:3000**
2. You should see the SlopGuard interface
3. Upload a video file (MP4 format, max 5MB)
4. Wait for processing (you'll see a loading screen)
5. View the results showing whether the video is AI-generated!

## Troubleshooting

### Backend Issues:

- **Port 5000 already in use?**
  - Change the port in `backend/src/server.py`:
    ```python
    app.run(debug=True, port=5001)  # Use a different port
    ```
  - Then update the frontend API URL in `frontend/components/uploadFile.tsx` and `frontend/app/page.tsx`

- **Model file not found?**
  - Check that `backend/models/ai_detector_model.keras` exists
  - Update the path in `backend/src/mainF.py` if needed

- **Import errors?**
  - Make sure all dependencies are installed: `pip install -r requirements.txt`
  - Make sure you're in the virtual environment

### Frontend Issues:

- **Port 3000 already in use?**
  - Next.js will automatically use the next available port (3001, 3002, etc.)
  - Or specify a port: `npm run dev -- -p 3001`

- **Can't connect to backend?**
  - Make sure the Flask server is running on port 5000
  - Check browser console for CORS errors
  - Verify the API URL in the frontend code matches your backend port

- **Build errors?**
  - Try deleting `node_modules` and reinstalling: `rm -rf node_modules && npm install`

## Running Both Servers

You'll need **two terminal windows**:
- **Terminal 1:** Backend (Flask on port 5000)
- **Terminal 2:** Frontend (Next.js on port 3000)

Keep both running while testing!

## Quick Start Commands

**Terminal 1 (Backend):**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd src
python server.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Then visit **http://localhost:3000** in your browser! 🎬

