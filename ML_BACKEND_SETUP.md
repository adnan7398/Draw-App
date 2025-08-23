# ML Backend Setup Guide for Draw-App

This guide will help you set up and run the AI-powered ML backend for your Draw-App project.

## 🚀 Quick Start

### 1. Prerequisites

- **Python 3.9+** installed on your system
- **Git** for version control
- **Node.js 18+** for the frontend (already in your project)
- **CUDA-compatible GPU** (optional, for faster AI inference)

### 2. Install Python Dependencies

```bash
cd apps/ml-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

Key environment variables to configure:
- `API_HOST`: Backend host (default: 0.0.0.0)
- `API_PORT`: Backend port (default: 3003)
- `ENABLE_GPU`: Enable GPU acceleration (default: true)
- `MODEL_CACHE_DIR`: Directory for ML models (default: ./models)

### 4. Start the ML Backend

#### Option A: Using the startup script (Recommended)
```bash
./start.sh
```

#### Option B: Manual start
```bash
# Activate virtual environment
source venv/bin/activate

# Start the service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3003 --reload
```

#### Option C: Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t ml-backend .
docker run -p 3003:3003 ml-backend
```

### 5. Verify Installation

The service should be running at:
- **Main API**: http://localhost:3003
- **Health Check**: http://localhost:3003/health
- **API Documentation**: http://localhost:3003/docs
- **Available Models**: http://localhost:3003/models/available

## 🧪 Testing the Backend

### Run the test script
```bash
cd apps/ml-backend
python3 test_api.py
```

### Manual API testing with curl
```bash
# Health check
curl http://localhost:3003/health

# Test drawing generation
curl -X POST http://localhost:3003/generate-drawing \
  -F "prompt=a beautiful sunset" \
  -F "style=realistic"

# Test image analysis (upload an image file)
curl -X POST http://localhost:3003/analyze-drawing \
  -F "image=@path/to/your/image.png" \
  -F "analysis_type=general"
```

## 🔧 Configuration Options

### Model Configuration

The backend automatically loads these ML models:
- **Image Classification**: Microsoft DialoGPT-medium
- **Text Generation**: GPT-2
- **Style Transfer**: Stable Diffusion v1.4

To customize models, edit `src/main.py`:

```python
# Load custom models
ml_manager.load_model("your-model-name", "image_classification")
ml_manager.load_model("your-model-name", "text_generation")
```

### Performance Tuning

For better performance:

1. **Enable GPU acceleration** (if available):
   ```bash
   # Install PyTorch with CUDA support
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Adjust model precision**:
   ```bash
   # In .env file
   MODEL_PRECISION=float16  # Faster, less memory
   ```

3. **Set memory limits**:
   ```bash
   # In .env file
   MAX_MODEL_MEMORY=4GB
   ```

## 🐳 Docker Deployment

### Production Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
EXPOSE 3003

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3003"]
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ml-backend

# Stop services
docker-compose down
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3003
   lsof -i :3003
   
   # Kill the process or change port in .env
   ```

2. **Model loading failures**
   ```bash
   # Check internet connection
   ping google.com
   
   # Clear model cache
   rm -rf models/*
   
   # Check disk space
   df -h
   ```

3. **Memory issues**
   ```bash
   # Monitor memory usage
   htop
   
   # Reduce model precision
   # Set MODEL_PRECISION=float16 in .env
   ```

4. **CUDA errors**
   ```bash
   # Check CUDA installation
   nvidia-smi
   
   # Install CPU-only PyTorch if needed
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   ```

### Logs and Debugging

```bash
# View application logs
tail -f logs/ml_backend.log

# Enable debug mode
# Set DEBUG=true in .env

# Check model status
curl http://localhost:3003/health
```

## 📱 Frontend Integration

The ML backend is already integrated with your frontend:

1. **Configuration**: Updated `apps/excelidraw-frontend/config.ts`
2. **AI Tools Component**: Created `apps/excelidraw-frontend/component/AITools.tsx`
3. **AI Tools Page**: Created `apps/excelidraw-frontend/app/ai-tools/page.tsx`
4. **Main Page**: Added AI features section

### Using AI Tools in Your App

```tsx
import AITools from '../component/AITools';

// In your component
<AITools 
  onImageGenerated={(imageData) => {
    // Handle generated image
  }}
  onImageEnhanced={(imageData) => {
    // Handle enhanced image
  }}
/>
```

## 🚀 Production Deployment

### Environment Variables for Production
```bash
DEBUG=false
LOG_LEVEL=WARNING
ENABLE_GPU=true
MODEL_PRECISION=float16
API_KEY=your_secure_api_key
RATE_LIMIT=100
CORS_ORIGINS=https://yourdomain.com
```

### Security Considerations
- Set strong API keys
- Configure CORS properly
- Use HTTPS in production
- Implement rate limiting
- Add authentication if needed

### Monitoring
- Health check endpoints
- Log aggregation
- Performance metrics
- Error tracking

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Detailed health status |
| GET | `/models/available` | List available ML models |
| POST | `/analyze-drawing` | Analyze uploaded drawing |
| POST | `/generate-drawing` | Generate drawing from text |
| POST | `/style-transfer` | Apply style transfer |
| POST | `/enhance-drawing` | Enhance image quality |

### Request/Response Examples

See the interactive API documentation at `http://localhost:3003/docs` when the service is running.

## 🤝 Contributing

To add new AI features:

1. **New ML Service**: Extend classes in `src/ml_services.py`
2. **New Endpoint**: Add routes in `src/main.py`
3. **New Models**: Update model loading logic
4. **Frontend Integration**: Update `AITools.tsx` component

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in `logs/ml_backend.log`
3. Test with the provided test script
4. Check the API documentation at `/docs`

## 🎯 Next Steps

After successful setup:

1. **Test all endpoints** with the test script
2. **Integrate with your drawing app** using the provided components
3. **Customize models** for your specific use case
4. **Add authentication** if needed
5. **Deploy to production** using Docker or your preferred method

---

**Happy AI-powered drawing! 🎨✨**
