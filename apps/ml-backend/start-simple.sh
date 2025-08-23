#!/bin/bash

# Simple ML Backend Startup Script

echo "🚀 Starting Draw-App ML Backend (Simplified)..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Running setup..."
    python3 setup-simple.py
    if [ $? -ne 0 ]; then
        echo "❌ Setup failed"
        exit 1
    fi
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if uvicorn is available
if ! python3 -c "import uvicorn" 2>/dev/null; then
    echo "❌ uvicorn not found. Installing dependencies..."
    pip install -r requirements-simple.txt
fi

# Start the service
echo "🎯 Starting ML Backend service..."
echo "📍 Service will be available at: http://localhost:3003"
echo "📊 Health check: http://localhost:3003/health"
echo "🔍 API docs: http://localhost:3003/docs"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

python3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 3003
