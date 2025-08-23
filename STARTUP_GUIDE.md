# Draw-App Monorepo Startup Guide

This guide will help you get the entire Draw-App monorepo running, including the new AI-powered ML backend.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** (for frontend and backend services)
- **Python 3.9+** (for ML backend)
- **pnpm** package manager
- **Git** for version control

### 2. Install Dependencies

```bash
# Install all Node.js dependencies
pnpm install

# Check Python requirements
pnpm run check-python

# If Python check fails, set up ML backend
pnpm run setup-ml
```

### 3. Start All Services

```bash
# Start all services (frontend, backends, ML backend)
pnpm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **HTTP Backend**: http://localhost:3002
- **WebSocket Backend**: ws://localhost:8081
- **ML Backend**: http://localhost:3003

## 🧠 ML Backend Setup

### Automatic Setup (Recommended)

```bash
# From monorepo root
pnpm run setup-ml

# Or from ML backend directory
cd apps/ml-backend
pnpm run setup
```

### Manual Setup

```bash
cd apps/ml-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create directories
mkdir -p models logs

# Copy environment file
cp env.example .env
```

### Verify ML Backend

```bash
# Check if everything is set up
pnpm run check-python

# Start ML backend only
pnpm --filter ml-backend dev

# Test the API
curl http://localhost:3003/health
```

## 🏗️ Project Structure

```
Draw-App/
├── apps/
│   ├── excelidraw-frontend/     # React frontend (port 3000)
│   ├── http-backned/            # HTTP backend (port 3002)
│   ├── ws-backend/              # WebSocket backend (port 8081)
│   └── ml-backend/              # AI/ML backend (port 3003)
├── packages/
│   ├── backend-common/          # Shared backend utilities
│   ├── common/                  # Shared types and utilities
│   ├── db/                      # Database package
│   ├── ui/                      # Shared UI components
│   └── ...
├── turbo.json                   # Monorepo build configuration
└── package.json                 # Root package configuration
```

## 🎯 Available Commands

### Root Level Commands

```bash
# Start all services
pnpm run dev

# Build all packages
pnpm run build

# Lint all packages
pnpm run lint

# Check Python requirements
pnpm run check-python

# Setup ML backend
pnpm run setup-ml
```

### Service-Specific Commands

```bash
# Frontend
pnpm --filter excelidraw-frontend dev

# HTTP Backend
pnpm --filter http-backned dev

# WebSocket Backend
pnpm --filter ws-backend dev

# ML Backend
pnpm --filter ml-backend dev
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using a port
lsof -i :3000  # Frontend
lsof -i :3002  # HTTP Backend
lsof -i :3003  # ML Backend
lsof -i :8081  # WebSocket Backend

# Kill process using a port
kill -9 <PID>
```

#### 2. Python Not Found

```bash
# Check Python installation
python3 --version

# Install Python (macOS)
brew install python@3.9

# Install Python (Ubuntu)
sudo apt install python3.9 python3.9-venv

# Install Python (Windows)
# Download from https://python.org
```

#### 3. ML Backend Dependencies Failed

```bash
# Clear virtual environment and retry
cd apps/ml-backend
rm -rf venv
pnpm run setup

# Or manually install
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Frontend Build Errors

```bash
# Clear Next.js cache
cd apps/excelidraw-frontend
rm -rf .next
pnpm run dev

# Reinstall dependencies
pnpm install
```

### Service Status Check

```bash
# Check all services
curl http://localhost:3000  # Frontend
curl http://localhost:3002  # HTTP Backend
curl http://localhost:3003/health  # ML Backend

# Check WebSocket (if you have a WebSocket client)
# ws://localhost:8081
```

## 🚀 Development Workflow

### 1. Start Development

```bash
# Start all services
pnpm run dev
```

### 2. Make Changes

- **Frontend**: Edit files in `apps/excelidraw-frontend/`
- **Backends**: Edit files in respective backend directories
- **ML Backend**: Edit Python files in `apps/ml-backend/src/`

### 3. Hot Reload

All services support hot reload:
- Frontend: Changes reflect immediately
- Backends: Restart automatically on file changes
- ML Backend: Python files reload automatically

### 4. Testing

```bash
# Test ML Backend
cd apps/ml-backend
python3 test_api.py

# Test frontend
cd apps/excelidraw-frontend
pnpm run test

# Test all packages
pnpm run test
```

## 🐳 Docker Development

### Start with Docker Compose

```bash
cd apps/ml-backend
docker-compose up --build
```

### Build Individual Services

```bash
# ML Backend
cd apps/ml-backend
docker build -t ml-backend .

# Run container
docker run -p 3003:3003 ml-backend
```

## 📱 Using the AI Features

### 1. Access AI Tools

- Navigate to `/ai-tools` in your frontend
- Or click "Try AI Tools" from the main page

### 2. Available AI Features

- **Drawing Analysis**: Upload and analyze drawings
- **Text-to-Drawing**: Generate drawings from descriptions
- **Style Transfer**: Apply artistic styles
- **Image Enhancement**: Improve drawing quality

### 3. API Endpoints

- **Health**: `GET /health`
- **Analysis**: `POST /analyze-drawing`
- **Generation**: `POST /generate-drawing`
- **Enhancement**: `POST /enhance-drawing`
- **Style Transfer**: `POST /style-transfer`

## 🔒 Environment Configuration

### Frontend Environment

```bash
# apps/excelidraw-frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_WS_URL=ws://localhost:8081
NEXT_PUBLIC_ML_URL=http://localhost:3003
```

### ML Backend Environment

```bash
# apps/ml-backend/.env
API_HOST=0.0.0.0
API_PORT=3003
DEBUG=true
ENABLE_GPU=false
MODEL_CACHE_DIR=./models
```

## 📚 Additional Resources

- **ML Backend Setup**: See `ML_BACKEND_SETUP.md`
- **API Documentation**: http://localhost:3003/docs (when ML backend is running)
- **Frontend Documentation**: See `apps/excelidraw-frontend/README.md`
- **Turbo Documentation**: https://turbo.build/repo/docs

## 🆘 Getting Help

### 1. Check Logs

```bash
# Frontend logs (in terminal)
# Backend logs (in terminal)
# ML Backend logs
tail -f apps/ml-backend/logs/ml_backend.log
```

### 2. Verify Services

```bash
# Check all services are running
pnpm run check-python
curl http://localhost:3003/health
```

### 3. Common Solutions

- **Restart services**: Stop with Ctrl+C, then `pnpm run dev`
- **Clear caches**: Remove `.next`, `node_modules`, `venv` directories
- **Reinstall dependencies**: `pnpm install` and `pnpm run setup-ml`

---

**Happy coding! 🎨✨**

If you encounter issues, check the troubleshooting section above or refer to the specific service documentation.
