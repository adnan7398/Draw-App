import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import cv2
from transformers import pipeline, AutoTokenizer, AutoModel
import io
import base64
from typing import List, Dict, Any, Optional, Tuple
import time
import psutil
import os

class MLServiceManager:
    """Manages different ML services and models"""
    
    def __init__(self):
        self.models = {}
        self.model_load_times = {}
        self.model_memory_usage = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    def load_model(self, model_name: str, model_type: str) -> bool:
        """Load a specific ML model"""
        start_time = time.time()
        
        try:
            if model_type == "image_classification":
                model = pipeline("image-classification", model=model_name, device=self.device)
            elif model_type == "text_generation":
                model = pipeline("text-generation", model=model_name, device=self.device)
            elif model_type == "image_to_image":
                model = pipeline("image-to-image", model=model_name, device=self.device)
            elif model_type == "object_detection":
                model = pipeline("object-detection", model=model_name, device=self.device)
            else:
                print(f"Unknown model type: {model_type}")
                return False
            
            self.models[model_name] = {
                "model": model,
                "type": model_type,
                "device": str(self.device)
            }
            
            load_time = time.time() - start_time
            self.model_load_times[model_name] = load_time
            
            # Get memory usage
            if torch.cuda.is_available():
                memory_allocated = torch.cuda.memory_allocated() / 1024**3  # GB
                self.model_memory_usage[model_name] = memory_allocated
            
            print(f"Model {model_name} loaded successfully in {load_time:.2f}s")
            return True
            
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            return False
    
    def get_model(self, model_name: str):
        """Get a loaded model"""
        return self.models.get(model_name, {}).get("model")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about all loaded models"""
        info = {}
        for name, details in self.models.items():
            info[name] = {
                "type": details["type"],
                "device": details["device"],
                "load_time": self.model_load_times.get(name, 0),
                "memory_usage": self.model_memory_usage.get(name, 0)
            }
        return info

class ImageAnalysisService:
    """Service for analyzing images and drawings"""
    
    def __init__(self, ml_manager: MLServiceManager):
        self.ml_manager = ml_manager
        
    def analyze_general(self, image: Image.Image) -> Dict[str, Any]:
        """Perform general image analysis"""
        img_array = np.array(image)
        
        analysis = {
            "dimensions": image.size,
            "mode": image.mode,
            "brightness": float(np.mean(img_array)),
            "contrast": float(np.std(img_array)),
            "aspect_ratio": round(image.size[0] / image.size[1], 2)
        }
        
        # Color analysis for RGB images
        if image.mode == "RGB":
            colors = np.mean(img_array, axis=(0, 1))
            analysis["dominant_colors"] = {
                "red": float(colors[0]),
                "green": float(colors[1]),
                "blue": float(colors[2])
            }
            
            # Calculate color diversity
            unique_colors = len(np.unique(img_array.reshape(-1, 3), axis=0))
            analysis["color_diversity"] = unique_colors
        
        # Edge detection for composition analysis
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
            
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        analysis["edge_density"] = float(edge_density)
        
        return analysis
    
    def analyze_content(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze image content using ML models"""
        # Try to use a pre-trained image classification model
        classifier = self.ml_manager.get_model("microsoft/DialoGPT-medium")
        
        if classifier:
            try:
                # Convert to RGB if needed
                img_rgb = image.convert("RGB")
                results = classifier(img_rgb)
                
                return {
                    "classification": results[:5],  # Top 5 predictions
                    "confidence_scores": [float(r["score"]) for r in results[:5]],
                    "top_label": results[0]["label"] if results else None
                }
            except Exception as e:
                return {"error": f"Classification failed: {str(e)}"}
        else:
            return {"error": "Image classifier not available"}
    
    def analyze_composition(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze image composition and layout"""
        img_array = np.array(image)
        
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Rule of thirds analysis
        height, width = gray.shape
        third_h = height // 3
        third_w = width // 3
        
        # Calculate interest points at rule of thirds intersections
        interest_points = [
            gray[third_h, third_w],
            gray[third_h, 2*third_w],
            gray[2*third_h, third_w],
            gray[2*third_h, 2*third_w]
        ]
        
        # Center of mass analysis
        moments = cv2.moments(gray)
        if moments["m00"] != 0:
            cx = int(moments["m10"] / moments["m00"])
            cy = int(moments["m01"] / moments["m00"])
            center_mass = (cx, cy)
        else:
            center_mass = (width//2, height//2)
        
        return {
            "rule_of_thirds_interest": [float(p) for p in interest_points],
            "center_of_mass": center_mass,
            "symmetry_score": self._calculate_symmetry(gray),
            "balance_score": self._calculate_balance(gray)
        }
    
    def _calculate_symmetry(self, gray_image: np.ndarray) -> float:
        """Calculate symmetry score of the image"""
        height, width = gray_image.shape
        mid_x = width // 2
        
        # Compare left and right halves
        left_half = gray_image[:, :mid_x]
        right_half = gray_image[:, mid_x:2*mid_x]
        
        if left_half.shape == right_half.shape:
            diff = np.abs(left_half - np.fliplr(right_half))
            symmetry_score = 1.0 - (np.mean(diff) / 255.0)
            return float(symmetry_score)
        return 0.5
    
    def _calculate_balance(self, gray_image: np.ndarray) -> float:
        """Calculate visual balance score"""
        height, width = gray_image.shape
        mid_x, mid_y = width // 2, height // 2
        
        # Divide image into quadrants
        q1 = gray_image[:mid_y, :mid_x]
        q2 = gray_image[:mid_y, mid_x:]
        q3 = gray_image[mid_y:, :mid_x]
        q4 = gray_image[mid_y:, mid_x:]
        
        # Calculate mean intensity for each quadrant
        means = [np.mean(q1), np.mean(q2), np.mean(q3), np.mean(q4)]
        
        # Balance is inverse of variance
        variance = np.var(means)
        balance_score = 1.0 / (1.0 + variance / 1000.0)
        
        return float(balance_score)

class DrawingGenerationService:
    """Service for generating drawings from text prompts"""
    
    def __init__(self, ml_manager: MLServiceManager):
        self.ml_manager = ml_manager
        
    def generate_from_prompt(self, prompt: str, style: str = "realistic", 
                           size: str = "512x512") -> Dict[str, Any]:
        """Generate drawing description from text prompt"""
        generator = self.ml_manager.get_model("gpt2")
        
        if generator:
            try:
                # Enhance prompt with style information
                enhanced_prompt = f"Create a {style} drawing of: {prompt}"
                
                generated_text = generator(
                    enhanced_prompt,
                    max_length=150,
                    num_return_sequences=1,
                    temperature=0.8,
                    do_sample=True,
                    pad_token_id=generator.tokenizer.eos_token_id
                )
                
                return {
                    "prompt": prompt,
                    "enhanced_prompt": enhanced_prompt,
                    "generated_description": generated_text[0]["generated_text"],
                    "style": style,
                    "size": size,
                    "status": "text_generated"
                }
                
            except Exception as e:
                return {"error": f"Generation failed: {str(e)}"}
        else:
            return {"error": "Text generator not available"}

class StyleTransferService:
    """Service for applying style transfer between images"""
    
    def __init__(self, ml_manager: MLServiceManager):
        self.ml_manager = ml_manager
        
    def apply_style_transfer(self, content_image: Image.Image, style_image: Image.Image,
                           strength: float = 0.8) -> Dict[str, Any]:
        """Apply style transfer between two images"""
        # This is a placeholder implementation
        # In production, you'd use a proper style transfer model
        
        content_size = content_image.size
        style_size = style_image.size
        
        # Simple blending as placeholder
        if content_size == style_size:
            # Blend images based on strength
            content_array = np.array(content_image.convert("RGB"))
            style_array = np.array(style_image.convert("RGB"))
            
            blended = (1 - strength) * content_array + strength * style_array
            blended = np.clip(blended, 0, 255).astype(np.uint8)
            
            # Convert back to PIL Image
            result_image = Image.fromarray(blended)
            
            # Convert to base64 for response
            img_buffer = io.BytesIO()
            result_image.save(img_buffer, format="PNG")
            result_b64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "status": "completed",
                "result_image": result_b64,
                "blending_strength": strength
            }
        else:
            return {
                "status": "failed",
                "error": "Images must be the same size for simple blending"
            }

class EnhancementService:
    """Service for enhancing image quality"""
    
    def __init__(self):
        pass
        
    def upscale_image(self, image: Image.Image, scale_factor: int = 2) -> Image.Image:
        """Upscale image using high-quality interpolation"""
        new_size = (image.size[0] * scale_factor, image.size[1] * scale_factor)
        return image.resize(new_size, Image.Resampling.LANCZOS)
    
    def denoise_image(self, image: Image.Image) -> Image.Image:
        """Apply denoising to image"""
        img_array = np.array(image)
        
        if len(img_array.shape) == 3:
            # Color image
            denoised = cv2.fastNlMeansDenoisingColored(img_array, None, 10, 10, 7, 21)
        else:
            # Grayscale image
            denoised = cv2.fastNlMeansDenoising(img_array, None, 10, 7, 21)
        
        return Image.fromarray(denoised)
    
    def sharpen_image(self, image: Image.Image) -> Image.Image:
        """Apply sharpening to image"""
        img_array = np.array(image)
        
        # Create sharpening kernel
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        
        if len(img_array.shape) == 3:
            # Apply to each color channel
            sharpened = np.zeros_like(img_array)
            for i in range(3):
                sharpened[:,:,i] = cv2.filter2D(img_array[:,:,i], -1, kernel)
        else:
            sharpened = cv2.filter2D(img_array, -1, kernel)
        
        # Clip values to valid range
        sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)
        return Image.fromarray(sharpened)
    
    def color_correct(self, image: Image.Image, brightness: float = 1.0, 
                     contrast: float = 1.0, saturation: float = 1.0) -> Image.Image:
        """Apply color corrections to image"""
        img_array = np.array(image.convert("RGB"))
        
        # Apply brightness and contrast
        img_array = img_array.astype(np.float32)
        img_array = img_array * contrast + (brightness - 1.0) * 128
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        
        # Convert to HSV for saturation adjustment
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV).astype(np.float32)
        hsv[:,:,1] = hsv[:,:,1] * saturation
        hsv[:,:,1] = np.clip(hsv[:,:,1], 0, 255)
        
        # Convert back to RGB
        corrected = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
        return Image.fromarray(corrected)
