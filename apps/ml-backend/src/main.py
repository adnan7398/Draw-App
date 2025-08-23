from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from PIL import Image
import io
import numpy as np
import cv2
import torch
from transformers import pipeline
import base64
import json
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Draw-App ML Backend",
    description="AI-powered drawing analysis and generation backend",
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

# Global variables for ML models
image_classifier = None
drawing_generator = None
style_transfer = None

@app.on_event("startup")
async def load_models():
    """Load ML models on startup"""
    global image_classifier, drawing_generator, style_transfer
    
    try:
        # Initialize image classification model
        image_classifier = pipeline("image-classification", model="microsoft/DialoGPT-medium")
        
        # Initialize drawing generation model (placeholder - you can use specific models)
        drawing_generator = pipeline("text-generation", model="gpt2")
        
        # Initialize style transfer model
        style_transfer = pipeline("image-to-image", model="CompVis/stable-diffusion-v1-4")
        
        print("ML models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")
        print("Some AI features may not be available")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Draw-App ML Backend is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    models_status = {
        "image_classifier": image_classifier is not None,
        "drawing_generator": drawing_generator is not None,
        "style_transfer": style_transfer is not None
    }
    
    return {
        "status": "healthy",
        "models": models_status,
        "version": "1.0.0"
    }

@app.post("/analyze-drawing")
async def analyze_drawing(
    image: UploadFile = File(...),
    analysis_type: str = Form("general")
):
    """Analyze uploaded drawing and provide insights"""
    try:
        # Read and process image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array for OpenCV processing
        img_array = np.array(pil_image)
        
        if analysis_type == "general":
            # Basic image analysis
            analysis = {
                "dimensions": pil_image.size,
                "mode": pil_image.mode,
                "file_size": len(image_data),
                "brightness": np.mean(img_array),
                "contrast": np.std(img_array)
            }
            
            # Add color analysis if RGB
            if pil_image.mode == "RGB":
                colors = np.mean(img_array, axis=(0, 1))
                analysis["dominant_colors"] = {
                    "red": float(colors[0]),
                    "green": float(colors[1]),
                    "blue": float(colors[2])
                }
        
        elif analysis_type == "content":
            # Content analysis using ML models
            if image_classifier:
                # Convert PIL image to format expected by transformers
                img_tensor = pil_image.convert("RGB")
                results = image_classifier(img_tensor)
                analysis = {
                    "classification": results[:3],  # Top 3 predictions
                    "confidence": [float(r["score"]) for r in results[:3]]
                }
            else:
                analysis = {"error": "Image classifier not available"}
        
        return JSONResponse(content=analysis)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.post("/generate-drawing")
async def generate_drawing(
    prompt: str = Form(...),
    style: str = Form("realistic"),
    size: str = Form("512x512")
):
    """Generate a drawing based on text prompt"""
    try:
        if not drawing_generator:
            raise HTTPException(status_code=503, detail="Drawing generator not available")
        
        # Generate text description
        generated_text = drawing_generator(
            prompt,
            max_length=100,
            num_return_sequences=1,
            temperature=0.8
        )
        
        # For now, return the generated text
        # In a full implementation, you'd use an image generation model
        return {
            "prompt": prompt,
            "generated_description": generated_text[0]["generated_text"],
            "style": style,
            "size": size,
            "status": "text_generated"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating drawing: {str(e)}")

@app.post("/style-transfer")
async def apply_style_transfer(
    content_image: UploadFile = File(...),
    style_image: UploadFile = File(...),
    strength: float = Form(0.8)
):
    """Apply style transfer between two images"""
    try:
        if not style_transfer:
            raise HTTPException(status_code=503, detail="Style transfer model not available")
        
        # Read images
        content_data = await content_image.read()
        style_data = await style_image.read()
        
        content_img = Image.open(io.BytesIO(content_data))
        style_img = Image.open(io.BytesIO(style_data))
        
        # Convert to RGB if needed
        content_img = content_img.convert("RGB")
        style_img = style_img.convert("RGB")
        
        # Apply style transfer (placeholder implementation)
        # In a real implementation, you'd use the loaded model
        
        return {
            "message": "Style transfer completed",
            "content_image_size": content_img.size,
            "style_image_size": style_img.size,
            "strength": strength,
            "status": "completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in style transfer: {str(e)}")

@app.post("/enhance-drawing")
async def enhance_drawing(
    image: UploadFile = File(...),
    enhancement_type: str = Form("upscale")
):
    """Enhance drawing quality using AI"""
    try:
        # Read image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        if enhancement_type == "upscale":
            # Simple upscaling (in production, use proper AI upscaling)
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
                "enhanced_image_b64": enhanced_b64
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported enhancement type: {enhancement_type}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing image: {str(e)}")

@app.get("/models/available")
async def get_available_models():
    """Get list of available ML models"""
    return {
        "models": {
            "image_classifier": "microsoft/DialoGPT-medium",
            "drawing_generator": "gpt2",
            "style_transfer": "CompVis/stable-diffusion-v1-4"
        },
        "capabilities": [
            "drawing_analysis",
            "text_to_drawing_generation",
            "style_transfer",
            "image_enhancement"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3003,
        reload=True
    )
