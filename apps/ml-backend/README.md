# Draw-App ML Backend

AI-powered backend service for drawing analysis, generation, and enhancement.

## Features

- **Drawing Analysis**: Analyze drawings for content, style, and composition
- **AI Generation**: Generate drawings from text prompts
- **Style Transfer**: Apply artistic styles to existing drawings
- **Image Enhancement**: Upscale, denoise, sharpen, and color-correct images
- **ML Model Management**: Efficient loading and management of AI models

## Quick Start

### Prerequisites

- Python 3.9+
- CUDA-compatible GPU (optional, for faster inference)

### Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the service:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The service will be available at `http://localhost:3003`

## API Endpoints

### Health & Status
- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /models/available` - List available ML models

### Drawing Analysis
- `POST /analyze-drawing` - Analyze uploaded drawing
  - `analysis_type`: "general", "content", "style", "composition"
  - `image`: Drawing file upload

### AI Generation
- `POST /generate-drawing` - Generate drawing from text
  - `prompt`: Text description
  - `style`: "realistic", "cartoon", "abstract", "impressionist", "cubist"
  - `size`: Output dimensions (e.g., "512x512")

### Style Transfer
- `POST /style-transfer` - Apply style between images
  - `content_image`: Content image file
  - `style_image`: Style reference image
  - `strength`: Transfer strength (0.0-1.0)

### Image Enhancement
- `POST /enhance-drawing` - Enhance image quality
  - `enhancement_type`: "upscale", "denoise", "sharpen", "color_correct"
  - `image`: Image file to enhance

## ML Models

The service automatically loads the following models:

- **Image Classification**: Microsoft DialoGPT-medium
- **Text Generation**: GPT-2
- **Style Transfer**: Stable Diffusion v1.4
- **Image Processing**: OpenCV + PIL

## Configuration

### Environment Variables

```bash
# Model Configuration
MODEL_CACHE_DIR=./models
ENABLE_GPU=true
MODEL_PRECISION=float16

# API Configuration
API_HOST=0.0.0.0
API_PORT=3003
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Security
API_KEY=your_api_key_here
RATE_LIMIT=100
```

### Model Customization

You can customize which models are loaded by modifying `src/main.py`:

```python
# Load custom models
ml_manager.load_model("your-model-name", "image_classification")
ml_manager.load_model("your-model-name", "text_generation")
```

## Development

### Project Structure

```
src/
├── main.py              # FastAPI application
├── models.py            # Pydantic data models
├── ml_services.py      # ML service implementations
└── __init__.py         # Package initialization
```

### Adding New Features

1. **New ML Service**: Extend the service classes in `ml_services.py`
2. **New Endpoint**: Add routes in `main.py`
3. **New Models**: Update the model loading logic

### Testing

```bash
# Run tests
npm test

# Run with coverage
pytest --cov=src

# Lint code
npm run lint

# Format code
npm run format
```

## Performance

### Optimization Tips

- Use GPU acceleration when available
- Enable model quantization for faster inference
- Implement caching for repeated requests
- Use async processing for long-running operations

### Monitoring

The service provides health endpoints for monitoring:
- Model loading status
- Memory usage
- Response times
- Error rates

## Deployment

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

### Production Considerations

- Use proper CORS configuration
- Implement rate limiting
- Add authentication/authorization
- Set up monitoring and logging
- Use load balancing for high traffic

## Troubleshooting

### Common Issues

1. **Model Loading Failures**
   - Check internet connection for model downloads
   - Verify sufficient disk space
   - Check GPU drivers if using CUDA

2. **Memory Issues**
   - Reduce batch sizes
   - Use model quantization
   - Monitor GPU memory usage

3. **Performance Issues**
   - Enable GPU acceleration
   - Use smaller models for development
   - Implement request caching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
