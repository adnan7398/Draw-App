from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from PIL import Image
import io
import numpy as np
import base64
import json
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Draw-App ML Backend",
    description="AI-powered drawing analysis and generation backend (Simplified Version)",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Draw-App ML Backend is running!", "status": "healthy", "version": "simplified"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "mode": "simplified",
        "capabilities": [
            "basic_image_analysis",
            "image_enhancement",
            "health_monitoring"
        ]
    }

@app.post("/analyze-drawing")
async def analyze_drawing(
    image: UploadFile = File(...),
    analysis_type: str = Form("general")
):
    """Analyze uploaded drawing and provide basic insights"""
    try:
        # Read and process image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array for basic processing
        img_array = np.array(pil_image)
        
        # Basic image analysis
        analysis = {
            "dimensions": pil_image.size,
            "mode": pil_image.mode,
            "file_size": len(image_data),
            "brightness": float(np.mean(img_array)),
            "contrast": float(np.std(img_array)),
            "analysis_type": analysis_type,
            "status": "completed"
        }
        
        # Add color analysis if RGB
        if pil_image.mode == "RGB":
            colors = np.mean(img_array, axis=(0, 1))
            analysis["dominant_colors"] = {
                "red": float(colors[0]),
                "green": float(colors[1]),
                "blue": float(colors[2])
            }
        
        return JSONResponse(content=analysis)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.post("/enhance-drawing")
async def enhance_drawing(
    image: UploadFile = File(...),
    enhancement_type: str = Form("upscale")
):
    """Enhance drawing quality using basic image processing"""
    try:
        # Read image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        if enhancement_type == "upscale":
            # Simple upscaling
            width, height = pil_image.size
            enhanced_image = pil_image.resize((width * 2, height * 2), Image.Resampling.LANCZOS)
            
            # Convert back to bytes
            img_buffer = io.BytesIO()
            enhanced_image.save(img_buffer, format="PNG")
            enhanced_data = img_buffer.getvalue()
            
            # Encode to base64 for response
            enhanced_b64 = base64.b64encode(enhanced_data).decode()
            
            return {
                "original_size": (width, height),
                "enhanced_size": (width * 2, height * 2),
                "enhancement_type": enhancement_type,
                "enhanced_image_b64": enhanced_b64,
                "status": "completed"
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported enhancement type: {enhancement_type}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing image: {str(e)}")

@app.get("/models/available")
async def get_available_models():
    """Get list of available capabilities (simplified version)"""
    return {
        "mode": "simplified",
        "capabilities": [
            "basic_image_analysis",
            "image_upscaling",
            "color_analysis",
            "file_metadata"
        ],
        "note": "This is a simplified version. Full ML features require additional setup."
    }

@app.post("/generate-drawing")
async def generate_drawing(
    prompt: str = Form(...),
    style: str = Form("realistic"),
    size: str = Form("512x512")
):
    """Placeholder for drawing generation (simplified version)"""
    return {
        "prompt": prompt,
        "style": style,
        "size": size,
        "status": "placeholder",
        "message": "Drawing generation requires full ML setup. This is a simplified version.",
        "note": "Run 'pnpm --filter ml-backend setup' to install full ML capabilities."
    }

@app.post("/style-transfer")
async def apply_style_transfer(
    content_image: UploadFile = File(...),
    style_image: UploadFile = File(...),
    strength: float = Form(0.8)
):
    """Placeholder for style transfer (simplified version)"""
    return {
        "message": "Style transfer requires full ML setup. This is a simplified version.",
        "note": "Run 'pnpm --filter ml-backend setup' to install full ML capabilities.",
        "status": "placeholder"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main-simple:app",
        host="0.0.0.0",
        port=3003,
        reload=True
    )
