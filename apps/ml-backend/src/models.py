from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AnalysisType(str, Enum):
    GENERAL = "general"
    CONTENT = "content"
    STYLE = "style"
    COMPOSITION = "composition"

class EnhancementType(str, Enum):
    UPSCALE = "upscale"
    DENOISE = "denoise"
    SHARPEN = "sharpen"
    COLOR_CORRECT = "color_correct"

class DrawingStyle(str, Enum):
    REALISTIC = "realistic"
    CARTOON = "cartoon"
    ABSTRACT = "abstract"
    IMPRESSIONIST = "impressionist"
    CUBIST = "cubist"

class ImageAnalysisRequest(BaseModel):
    analysis_type: AnalysisType = Field(default=AnalysisType.GENERAL, description="Type of analysis to perform")
    include_metadata: bool = Field(default=True, description="Include image metadata in response")

class ImageAnalysisResponse(BaseModel):
    analysis_type: AnalysisType
    dimensions: tuple[int, int]
    mode: str
    file_size: int
    brightness: float
    contrast: float
    dominant_colors: Optional[Dict[str, float]] = None
    classification: Optional[List[Dict[str, Any]]] = None
    confidence: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None

class DrawingGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text description of the drawing to generate")
    style: DrawingStyle = Field(default=DrawingStyle.REALISTIC, description="Artistic style for generation")
    size: str = Field(default="512x512", description="Output image dimensions")
    num_variations: int = Field(default=1, ge=1, le=4, description="Number of variations to generate")

class DrawingGenerationResponse(BaseModel):
    prompt: str
    generated_description: str
    style: DrawingStyle
    size: str
    status: str
    variations: Optional[List[str]] = None  # Base64 encoded images

class StyleTransferRequest(BaseModel):
    content_image: bytes = Field(..., description="Content image data")
    style_image: bytes = Field(..., description="Style reference image data")
    strength: float = Field(default=0.8, ge=0.0, le=1.0, description="Style transfer strength")
    preserve_content: bool = Field(default=True, description="Preserve content structure")

class StyleTransferResponse(BaseModel):
    message: str
    content_image_size: tuple[int, int]
    style_image_size: tuple[int, int]
    strength: float
    status: str
    result_image: Optional[str] = None  # Base64 encoded result

class EnhancementRequest(BaseModel):
    enhancement_type: EnhancementType = Field(..., description="Type of enhancement to apply")
    quality: float = Field(default=0.8, ge=0.1, le=1.0, description="Enhancement quality level")
    preserve_original: bool = Field(default=True, description="Keep original image")

class EnhancementResponse(BaseModel):
    original_size: tuple[int, int]
    enhanced_size: tuple[int, int]
    enhancement_type: EnhancementType
    enhancement_type: EnhancementType
    enhanced_image_b64: str
    quality_score: Optional[float] = None

class ModelInfo(BaseModel):
    name: str
    version: str
    capabilities: List[str]
    status: str
    memory_usage: Optional[float] = None
    load_time: Optional[float] = None

class HealthResponse(BaseModel):
    status: str
    models: Dict[str, bool]
    version: str
    uptime: Optional[float] = None
    memory_usage: Optional[float] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
    timestamp: Optional[str] = None
