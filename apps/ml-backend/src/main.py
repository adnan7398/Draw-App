"""
Draw-App ML Backend - AI-Powered Drawing Features
Core AI features: Shape Recognition, Diagram Detection, OCR, AI Assistance
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from PIL import Image
import io
import numpy as np
import cv2
import base64
import json
from typing import List, Optional
import os
from dotenv import load_dotenv

# Import AI services
from ai_services import (
    ShapeRecognitionService, 
    DiagramDetectionService, 
    OCRService, 
    AIAssistantService
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Draw-App AI Backend",
    description="AI-powered drawing features: Shape Recognition, Diagram Detection, OCR, and AI Assistance",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
shape_service = ShapeRecognitionService()
diagram_service = DiagramDetectionService()
ocr_service = OCRService()
ai_assistant = AIAssistantService()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Draw-App AI Backend is running!", 
        "status": "healthy", 
        "version": "2.0.0",
        "features": [
            "AI Shape Recognition",
            "Smart Whiteboard (Diagram Detection)",
            "Handwriting Recognition (OCR)",
            "AI Assistant"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "services": {
            "shape_recognition": "available",
            "diagram_detection": "available", 
            "ocr": "available",
            "ai_assistant": "available"
        },
        "capabilities": [
            "shape_detection_and_cleaning",
            "diagram_type_detection",
            "handwriting_to_text",
            "diagram_suggestions",
            "auto_arrangement"
        ]
    }

# ===== AI SHAPE RECOGNITION =====

@app.post("/ai/shape-recognition")
async def recognize_shapes(
    image: UploadFile = File(...),
    clean_shapes: bool = Form(False)
):
    """AI Shape Recognition - Convert rough sketches to neat shapes"""
    try:
        # Read and process image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        img_array = np.array(pil_image)
        
        # Detect shapes
        shape_analysis = shape_service.detect_shapes(img_array)
        
        result = {
            "shapes_detected": shape_analysis["shapes_detected"],
            "shapes": shape_analysis["shapes"],
            "total_contours": shape_analysis["total_contours"],
            "cleaned_shapes": False
        }
        
        # Clean shapes if requested
        if clean_shapes and shape_analysis["shapes"]:
            cleaned_image = shape_service.clean_shapes(img_array, shape_analysis["shapes"])
            
            # Convert cleaned image to base64
            cleaned_pil = Image.fromarray(cleaned_image)
            img_buffer = io.BytesIO()
            cleaned_pil.save(img_buffer, format="PNG")
            cleaned_b64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            result["cleaned_image"] = cleaned_b64
            result["cleaned_shapes"] = True
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shape recognition failed: {str(e)}")

# ===== SMART WHITEBOARD (DIAGRAM DETECTION) =====

@app.post("/ai/diagram-detection")
async def detect_diagram(
    image: UploadFile = File(...),
    clean_diagram: bool = Form(False)
):
    """Smart Whiteboard - Detect diagrams (flowcharts, UMLs, mindmaps) and clean them up"""
    try:
        # Read and process image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        img_array = np.array(pil_image)
        
        # Detect diagram type
        diagram_analysis = diagram_service.detect_diagram_type(img_array)
        
        result = {
            "diagram_type": diagram_analysis["diagram_type"],
            "confidence": diagram_analysis["confidence"],
            "analysis": {
                "structure_score": diagram_analysis["structure_score"],
                "connection_score": diagram_analysis["connection_score"],
                "text_density": diagram_analysis["text_density"]
            },
            "cleaned_diagram": False
        }
        
        # Clean diagram if requested
        if clean_diagram:
            cleaned_image = diagram_service.clean_diagram(img_array, diagram_analysis["diagram_type"])
            
            # Convert cleaned image to base64
            cleaned_pil = Image.fromarray(cleaned_image)
            img_buffer = io.BytesIO()
            cleaned_pil.save(img_buffer, format="PNG")
            cleaned_b64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            result["cleaned_image"] = cleaned_b64
            result["cleaned_diagram"] = True
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagram detection failed: {str(e)}")

# ===== HANDWRITING RECOGNITION (OCR) =====

@app.post("/ai/handwriting-recognition")
async def recognize_handwriting(
    image: UploadFile = File(...),
    enhance_image: bool = Form(False)
):
    """Handwriting Recognition (OCR) - Convert handwritten notes to editable text"""
    try:
        # Read and process image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        img_array = np.array(pil_image)
        
        # Enhance image if requested
        if enhance_image:
            enhanced_image = ocr_service.enhance_handwriting(img_array)
            img_array = enhanced_image
        
        # Extract text
        ocr_result = ocr_service.extract_text(img_array)
        
        result = {
            "extracted_text": ocr_result["text"],
            "confidence": ocr_result["confidence"],
            "word_count": ocr_result["word_count"],
            "words": ocr_result.get("words", []),
            "enhanced_image": enhance_image
        }
        
        # Add enhanced image if requested
        if enhance_image:
            enhanced_pil = Image.fromarray(img_array)
            img_buffer = io.BytesIO()
            enhanced_pil.save(img_buffer, format="PNG")
            enhanced_b64 = base64.b64encode(img_buffer.getvalue()).decode()
            result["enhanced_image_b64"] = enhanced_b64
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Handwriting recognition failed: {str(e)}")

# ===== AI ASSISTANT =====

@app.post("/ai/suggest-diagram")
async def suggest_diagram(description: str = Form(...)):
    """AI Assistant - Suggest diagram type based on description"""
    try:
        suggestion = ai_assistant.suggest_diagram(description)
        return JSONResponse(content=suggestion)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagram suggestion failed: {str(e)}")

@app.post("/ai/suggest-icons")
async def suggest_icons(context: str = Form(...)):
    """AI Assistant - Suggest relevant icons for the context"""
    try:
        icons = ai_assistant.suggest_icons(context)
        return JSONResponse(content={"suggested_icons": icons, "context": context})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Icon suggestion failed: {str(e)}")

@app.post("/ai/auto-arrange")
async def auto_arrange_drawings(
    shapes: str = Form(...),  # JSON string of shapes
    canvas_width: int = Form(800),
    canvas_height: int = Form(600)
):
    """AI Assistant - Auto-arrange messy drawings into organized layout"""
    try:
        # Parse shapes JSON
        shapes_data = json.loads(shapes)
        canvas_size = (canvas_width, canvas_height)
        
        # Auto-arrange
        arranged_shapes = ai_assistant.auto_arrange_drawings(shapes_data, canvas_size)
        
        return JSONResponse(content={
            "arranged_shapes": arranged_shapes,
            "canvas_size": canvas_size,
            "shapes_count": len(arranged_shapes)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-arrangement failed: {str(e)}")

@app.post("/ai/generate-description")
async def generate_diagram_description(
    diagram_type: str = Form(...),
    elements: str = Form(...)  # JSON string of elements
):
    """AI Assistant - Generate description for diagram"""
    try:
        # Parse elements JSON
        elements_data = json.loads(elements)
        
        # Generate description
        description = ai_assistant.generate_diagram_description(diagram_type, elements_data)
        
        return JSONResponse(content={
            "diagram_type": diagram_type,
            "elements": elements_data,
            "generated_description": description
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Description generation failed: {str(e)}")

# ===== COMBINED AI ANALYSIS =====

@app.post("/ai/complete-analysis")
async def complete_ai_analysis(
    image: UploadFile = File(...),
    include_ocr: bool = Form(True),
    include_shape_recognition: bool = Form(True),
    include_diagram_detection: bool = Form(True)
):
    """Complete AI analysis of drawing - combines all features"""
    try:
        # Read and process image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        img_array = np.array(pil_image)
        
        result = {
            "image_info": {
                "dimensions": pil_image.size,
                "mode": pil_image.mode,
                "file_size": len(image_data)
            },
            "analysis": {}
        }
        
        # Shape recognition
        if include_shape_recognition:
            shape_analysis = shape_service.detect_shapes(img_array)
            result["analysis"]["shapes"] = shape_analysis
        
        # Diagram detection
        if include_diagram_detection:
            diagram_analysis = diagram_service.detect_diagram_type(img_array)
            result["analysis"]["diagram"] = diagram_analysis
        
        # OCR
        if include_ocr:
            ocr_result = ocr_service.extract_text(img_array)
            result["analysis"]["text"] = ocr_result
        
        # AI suggestions
        if result["analysis"].get("diagram"):
            diagram_type = result["analysis"]["diagram"]["diagram_type"]
            suggestion = ai_assistant.suggest_diagram(f"Create a {diagram_type} diagram")
            result["analysis"]["suggestions"] = suggestion
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complete analysis failed: {str(e)}")

@app.get("/ai/capabilities")
async def get_ai_capabilities():
    """Get list of available AI capabilities"""
    return {
        "ai_features": {
            "shape_recognition": {
                "description": "AI Shape Recognition - Convert rough sketches to neat shapes",
                "endpoints": ["/ai/shape-recognition"],
                "capabilities": ["detect_shapes", "clean_shapes", "classify_geometric_forms"]
            },
            "diagram_detection": {
                "description": "Smart Whiteboard - Detect diagrams and clean them up",
                "endpoints": ["/ai/diagram-detection"],
                "capabilities": ["detect_diagram_type", "clean_diagram", "analyze_structure"]
            },
            "handwriting_recognition": {
                "description": "Handwriting Recognition (OCR) - Convert handwritten notes to text",
                "endpoints": ["/ai/handwriting-recognition"],
                "capabilities": ["extract_text", "enhance_handwriting", "word_detection"]
            },
            "ai_assistant": {
                "description": "AI Assistant - Suggest diagrams, icons, auto-arrange drawings",
                "endpoints": [
                    "/ai/suggest-diagram",
                    "/ai/suggest-icons", 
                    "/ai/auto-arrange",
                    "/ai/generate-description"
                ],
                "capabilities": ["diagram_suggestions", "icon_recommendations", "auto_arrangement"]
            }
        },
        "combined_features": {
            "complete_analysis": "/ai/complete-analysis",
            "description": "Run all AI features on a single image"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3003,
        reload=True
    )
