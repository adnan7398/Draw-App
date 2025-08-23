# Draw-App AI Backend 🧠

AI-powered backend service for intelligent drawing features. Converts rough sketches to neat shapes, detects diagram types, recognizes handwriting, and provides AI assistance.

## 🚀 Core AI Features

### 1. **AI Shape Recognition** 🔷
- **Convert rough sketches to neat shapes**
- **Detect geometric forms**: circles, rectangles, triangles, diamonds, lines, arrows
- **Clean up drawings** with automatic shape correction
- **Confidence scoring** for shape detection accuracy

**Endpoint**: `POST /ai/shape-recognition`

### 2. **Smart Whiteboard (Diagram Detection)** 📊
- **Detect diagram types**: flowcharts, UMLs, mindmaps, networks, organizational charts
- **Analyze structure patterns** and connection density
- **Clean up diagrams** with automatic enhancement
- **Intelligent classification** based on visual patterns

**Endpoint**: `POST /ai/diagram-detection`

### 3. **Handwriting Recognition (OCR)** ✍️
- **Convert handwritten notes to editable text**
- **Enhance handwriting** for better recognition
- **Word-level detection** with confidence scores
- **Multi-language support** (English by default)

**Endpoint**: `POST /ai/handwriting-recognition`

### 4. **AI Assistant** 🤖
- **Suggest diagram types** based on descriptions
- **Recommend relevant icons** for context
- **Auto-arrange messy drawings** into organized layouts
- **Generate descriptions** for diagrams

**Endpoints**:
- `POST /ai/suggest-diagram`
- `POST /ai/suggest-icons`
- `POST /ai/auto-arrange`
- `POST /ai/generate-description`

### 5. **Complete AI Analysis** 🔬
- **Run all AI features** on a single image
- **Comprehensive insights** combining shape, diagram, and text analysis
- **AI-powered suggestions** for improvement
- **Unified response** with all analysis results

**Endpoint**: `POST /ai/complete-analysis`

## 🛠️ Quick Start

### Prerequisites
- Python 3.9+
- Virtual environment

### Installation
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 3003
```

### Using pnpm (from monorepo root)
```bash
# Setup ML backend
pnpm run setup-ml

# Start ML backend only
pnpm --filter ml-backend dev

# Start all services
pnpm run dev
```

## 📡 API Endpoints

### Health & Status
- `GET /` - Service status and features
- `GET /health` - Detailed health check
- `GET /ai/capabilities` - List all AI capabilities

### AI Shape Recognition
```bash
POST /ai/shape-recognition
- image: Drawing file (PNG, JPG)
- clean_shapes: Boolean (optional, default: false)
```

**Response**:
```json
{
  "shapes_detected": 3,
  "shapes": [
    {
      "type": "rectangle",
      "confidence": 0.85,
      "bbox": [50, 50, 100, 50],
      "vertices": 4
    }
  ],
  "cleaned_shapes": true,
  "cleaned_image": "base64_encoded_image"
}
```

### Diagram Detection
```bash
POST /ai/diagram-detection
- image: Drawing file
- clean_diagram: Boolean (optional, default: false)
```

**Response**:
```json
{
  "diagram_type": "flowchart",
  "confidence": 0.78,
  "analysis": {
    "structure_score": 0.85,
    "connection_score": 0.72,
    "text_density": 0.31
  }
}
```

### Handwriting Recognition
```bash
POST /ai/handwriting-recognition
- image: Handwritten notes file
- enhance_image: Boolean (optional, default: false)
```

**Response**:
```json
{
  "extracted_text": "Hello world",
  "confidence": 0.92,
  "word_count": 2,
  "words": [
    {
      "text": "Hello",
      "confidence": 0.95,
      "bbox": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    }
  ]
}
```

### AI Assistant
```bash
# Diagram suggestions
POST /ai/suggest-diagram
- description: "Create a user registration workflow"

# Icon suggestions
POST /ai/suggest-icons
- context: "business technology"

# Auto-arrange drawings
POST /ai/auto-arrange
- shapes: JSON string of shape data
- canvas_width: 800
- canvas_height: 600
```

## 🧪 Testing

### Run AI Feature Tests
```bash
# Test all AI features
python3 test_ai_features.py

# Or using pnpm
pnpm --filter ml-backend test
```

### Manual Testing
```bash
# Health check
curl http://localhost:3003/health

# AI capabilities
curl http://localhost:3003/ai/capabilities

# Test with sample image
curl -X POST http://localhost:3003/ai/shape-recognition \
  -F "image=@your_drawing.png" \
  -F "clean_shapes=true"
```

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=3003
DEBUG=true

# AI Model Configuration
ENABLE_GPU=false
MODEL_CACHE_DIR=./models
```

### Dependencies
The service automatically installs and manages:
- **Computer Vision**: OpenCV, scikit-image
- **Machine Learning**: PyTorch, scikit-learn
- **OCR**: EasyOCR, pytesseract
- **AI Models**: Transformers, sentence-transformers
- **Image Processing**: Pillow, NumPy

## 🚀 Production Deployment

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
EXPOSE 3003

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3003"]
```

### Performance Optimization
- **GPU Acceleration**: Set `ENABLE_GPU=true` for CUDA support
- **Model Caching**: Configure `MODEL_CACHE_DIR` for persistent models
- **Batch Processing**: Process multiple images simultaneously
- **Async Processing**: Non-blocking AI operations

## 🔍 Troubleshooting

### Common Issues

1. **Shape Detection Not Working**
   - Ensure image has clear, distinct shapes
   - Check image quality and contrast
   - Verify OpenCV installation

2. **OCR Recognition Poor**
   - Use `enhance_image=true` parameter
   - Ensure handwriting is clear and readable
   - Check EasyOCR installation

3. **Diagram Detection Inaccurate**
   - Ensure diagram has clear structure
   - Check for sufficient contrast
   - Verify image preprocessing

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true

# Check service logs
tail -f logs/ml_backend.log
```

## 📚 API Documentation

When the service is running, visit:
- **Interactive API Docs**: http://localhost:3003/docs
- **ReDoc Documentation**: http://localhost:3003/redoc
- **OpenAPI Schema**: http://localhost:3003/openapi.json

## 🤝 Contributing

### Adding New AI Features
1. **Create service class** in `src/ai_services.py`
2. **Add endpoint** in `src/main.py`
3. **Update capabilities** in `/ai/capabilities` endpoint
4. **Add tests** in `test_ai_features.py`

### Code Style
```bash
# Format code
pnpm --filter ml-backend format

# Lint code
pnpm --filter ml-backend lint
```

## 📄 License

This project is licensed under the MIT License.

---

**Transform your drawings with AI! 🎨✨**

For support and questions, check the API documentation or test endpoints.
