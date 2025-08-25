"""
AI Services for Draw-App
Core AI features: Shape Recognition, Diagram Detection, OCR, AI Assistance
"""

import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from transformers import pipeline
# import easyocr
# import matplotlib.pyplot as plt
# import seaborn as sns
from typing import List, Dict, Any, Tuple, Optional
import json
import io
import base64

class ShapeRecognitionService:
    """AI Shape Recognition - Convert rough sketches to neat shapes"""
    
    def __init__(self):
        self.shape_names = ['circle', 'rectangle', 'triangle', 'line', 'arrow', 'diamond']
        
    def detect_shapes(self, image: np.ndarray) -> Dict[str, Any]:
        """Detect and classify shapes in the image"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detected_shapes = []
        
        for contour in contours:
            # Approximate contour to polygon
            epsilon = 0.02 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Classify shape based on number of vertices
            shape_type = self._classify_shape(approx)
            
            if shape_type:
                # Get bounding box
                x, y, w, h = cv2.boundingRect(contour)
                
                detected_shapes.append({
                    'type': shape_type,
                    'confidence': 0.85,  # Placeholder confidence
                    'bbox': [x, y, w, h],
                    'vertices': len(approx)
                })
        
        return {
            'shapes_detected': len(detected_shapes),
            'shapes': detected_shapes,
            'total_contours': len(contours)
        }
    
    def _classify_shape(self, approx: np.ndarray) -> Optional[str]:
        """Classify shape based on number of vertices"""
        vertices = len(approx)
        
        if vertices == 3:
            return 'triangle'
        elif vertices == 4:
            # Check if it's a rectangle or diamond
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h
            if 0.8 <= aspect_ratio <= 1.2:
                return 'diamond'
            else:
                return 'rectangle'
        elif vertices == 5:
            return 'pentagon'
        elif vertices == 6:
            return 'hexagon'
        elif vertices == 8:
            return 'octagon'
        elif vertices > 8:
            return 'circle'
        else:
            return None
    
    def clean_shapes(self, image: np.ndarray, detected_shapes: List[Dict]) -> np.ndarray:
        """Clean up rough sketches into neat shapes"""
        cleaned_image = image.copy()
        
        for shape in detected_shapes:
            bbox = shape['bbox']
            x, y, w, h = bbox
            
            if shape['type'] == 'rectangle':
                # Draw clean rectangle
                cv2.rectangle(cleaned_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
            elif shape['type'] == 'circle':
                # Draw clean circle
                center = (x + w//2, y + h//2)
                radius = min(w, h) // 2
                cv2.circle(cleaned_image, center, radius, (0, 255, 0), 2)
            elif shape['type'] == 'triangle':
                # Draw clean triangle
                pts = np.array([[x, y + h], [x + w//2, y], [x + w, y + h]], np.int32)
                cv2.polylines(cleaned_image, [pts], True, (0, 255, 0), 2)
        
        return cleaned_image

class DiagramDetectionService:
    """Smart Whiteboard - Detect and clean up diagrams (flowcharts, UMLs, mindmaps)"""
    
    def __init__(self):
        self.diagram_types = ['flowchart', 'uml', 'mindmap', 'network', 'organizational']
        
    def detect_diagram_type(self, image: np.ndarray) -> Dict[str, Any]:
        """Detect the type of diagram in the image"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Analyze structure patterns
        structure_score = self._analyze_structure(gray)
        connection_score = self._analyze_connections(gray)
        text_density = self._analyze_text_density(gray)
        
        # Determine diagram type based on scores
        diagram_type = self._classify_diagram(structure_score, connection_score, text_density)
        
        return {
            'diagram_type': diagram_type,
            'confidence': 0.78,
            'structure_score': structure_score,
            'connection_score': connection_score,
            'text_density': text_density
        }
    
    def _analyze_structure(self, gray: np.ndarray) -> float:
        """Analyze structural patterns in the image"""
        # Detect lines and edges
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
        
        if lines is not None:
            return min(len(lines) / 100.0, 1.0)  # Normalize to 0-1
        return 0.0
    
    def _analyze_connections(self, gray: np.ndarray) -> float:
        """Analyze connection patterns (nodes, edges)"""
        # Find contours (potential nodes)
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Count potential nodes
        node_count = len([c for c in contours if cv2.contourArea(c) > 100])
        return min(node_count / 20.0, 1.0)  # Normalize to 0-1
    
    def _analyze_text_density(self, gray: np.ndarray) -> float:
        """Analyze text density in the image"""
        # Simple text density estimation
        # This is a placeholder - in production you'd use OCR
        return 0.3  # Placeholder value
    
    def _classify_diagram(self, structure: float, connections: float, text: float) -> str:
        """Classify diagram type based on analysis scores"""
        if connections > 0.7 and structure > 0.5:
            return 'flowchart'
        elif text > 0.6 and structure > 0.4:
            return 'uml'
        elif connections > 0.8 and text < 0.3:
            return 'mindmap'
        elif structure > 0.8:
            return 'network'
        else:
            return 'organizational'
    
    def clean_diagram(self, image: np.ndarray, diagram_type: str) -> np.ndarray:
        """Clean up and enhance the detected diagram"""
        cleaned = image.copy()
        
        if diagram_type == 'flowchart':
            # Enhance lines and boxes
            cleaned = self._enhance_flowchart(cleaned)
        elif diagram_type == 'uml':
            # Clean up UML diagrams
            cleaned = self._enhance_uml(cleaned)
        elif diagram_type == 'mindmap':
            # Enhance mindmap structure
            cleaned = self._enhance_mindmap(cleaned)
        
        return cleaned
    
    def _enhance_flowchart(self, image: np.ndarray) -> np.ndarray:
        """Enhance flowchart elements"""
        # Enhance edges
        kernel = np.ones((2, 2), np.uint8)
        enhanced = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
        return enhanced
    
    def _enhance_uml(self, image: np.ndarray) -> np.ndarray:
        """Enhance UML diagram elements"""
        # Enhance boxes and lines
        kernel = np.ones((3, 3), np.uint8)
        enhanced = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
        return enhanced
    
    def _enhance_mindmap(self, image: np.ndarray) -> np.ndarray:
        """Enhance mindmap structure"""
        # Enhance central node and connections
        kernel = np.ones((2, 2), np.uint8)
        enhanced = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
        return enhanced

class OCRService:
    """Handwriting Recognition (OCR) - Convert handwritten notes to editable text"""
    
    def __init__(self):
        # Initialize EasyOCR for handwriting recognition
        # try:
        #     self.reader = easyocr.Reader(['en'])
        # except:
        self.reader = None
        print("Warning: EasyOCR not available, OCR features will be limited")
    
    def extract_text(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text from handwritten notes"""
        if self.reader is None:
            return {
                'text': '',
                'confidence': 0.0,
                'error': 'OCR service not available'
            }
        
        try:
            # Convert BGR to RGB if needed
            if len(image.shape) == 3:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                image_rgb = image
            
            # Extract text
            results = self.reader.readtext(image_rgb)
            
            extracted_text = []
            total_confidence = 0.0
            
            for (bbox, text, confidence) in results:
                extracted_text.append({
                    'text': text,
                    'confidence': confidence,
                    'bbox': bbox
                })
                total_confidence += confidence
            
            avg_confidence = total_confidence / len(results) if results else 0.0
            
            return {
                'text': ' '.join([item['text'] for item in extracted_text]),
                'confidence': avg_confidence,
                'words': extracted_text,
                'word_count': len(extracted_text)
            }
            
        except Exception as e:
            return {
                'text': '',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def enhance_handwriting(self, image: np.ndarray) -> np.ndarray:
        """Enhance handwriting for better OCR results"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        # Apply adaptive thresholding
        enhanced = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced)
        
        # Convert back to RGB if original was RGB
        if len(image.shape) == 3:
            enhanced_rgb = cv2.cvtColor(denoised, cv2.COLOR_GRAY2RGB)
            return enhanced_rgb
        
        return denoised

class AIAssistantService:
    """AI Assistant - Suggest diagrams, icons, or auto-arrange messy drawings"""
    
    def __init__(self):
        try:
            # Initialize text generation pipeline
            self.text_generator = pipeline("text-generation", model="gpt2", device=-1)
        except:
            self.text_generator = None
            print("Warning: Text generation not available")
    
    def suggest_diagram(self, description: str) -> Dict[str, Any]:
        """Suggest diagram type based on description"""
        suggestions = {
            'flowchart': ['process', 'workflow', 'steps', 'procedure', 'algorithm'],
            'uml': ['class', 'object', 'system', 'architecture', 'design'],
            'mindmap': ['ideas', 'concepts', 'brainstorming', 'planning', 'organization'],
            'network': ['connections', 'relationships', 'graph', 'nodes', 'links'],
            'organizational': ['hierarchy', 'structure', 'team', 'management', 'roles']
        }
        
        description_lower = description.lower()
        scores = {}
        
        for diagram_type, keywords in suggestions.items():
            score = sum(1 for keyword in keywords if keyword in description_lower)
            scores[diagram_type] = score
        
        # Get best match
        best_type = max(scores, key=scores.get)
        confidence = scores[best_type] / max(len(keywords) for keywords in suggestions.values())
        
        return {
            'suggested_diagram': best_type,
            'confidence': confidence,
            'reasoning': f"Based on keywords: {', '.join([k for k, v in scores.items() if v > 0])}",
            'alternatives': [k for k, v in scores.items() if v > 0 and k != best_type]
        }
    
    def suggest_icons(self, context: str) -> List[str]:
        """Suggest relevant icons for the context"""
        icon_suggestions = {
            'business': ['📊', '💼', '📈', '🎯', '💡'],
            'technology': ['💻', '🔧', '⚙️', '🌐', '📱'],
            'design': ['🎨', '✏️', '🖌️', '🎭', '📐'],
            'education': ['📚', '🎓', '✏️', '🔬', '📝'],
            'health': ['🏥', '💊', '🩺', '❤️', '🔬']
        }
        
        context_lower = context.lower()
        
        for category, icons in icon_suggestions.items():
            if category in context_lower:
                return icons
        
        # Default icons
        return ['📝', '💡', '🔗', '📊', '🎯']
    
    def auto_arrange_drawings(self, shapes: List[Dict], canvas_size: Tuple[int, int]) -> List[Dict]:
        """Auto-arrange messy drawings into organized layout"""
        if not shapes:
            return []
        
        # Simple grid arrangement
        canvas_width, canvas_height = canvas_size
        cols = int(np.ceil(np.sqrt(len(shapes))))
        rows = int(np.ceil(len(shapes) / cols))
        
        cell_width = canvas_width // cols
        cell_height = canvas_height // rows
        
        arranged_shapes = []
        
        for i, shape in enumerate(shapes):
            row = i // cols
            col = i % cols
            
            # Center shape in cell
            new_x = col * cell_width + cell_width // 2
            new_y = row * cell_height + cell_height // 2
            
            # Update shape position
            arranged_shape = shape.copy()
            arranged_shape['bbox'] = [new_x, new_y, shape['bbox'][2], shape['bbox'][3]]
            arranged_shapes.append(arranged_shape)
        
        return arranged_shapes
    
    def generate_diagram_description(self, diagram_type: str, elements: List[str]) -> str:
        """Generate description for diagram based on type and elements"""
        if self.text_generator is None:
            return f"A {diagram_type} diagram containing: {', '.join(elements)}"
        
        prompt = f"Create a {diagram_type} diagram with elements: {', '.join(elements)}"
        
        try:
            result = self.text_generator(prompt, max_length=100, num_return_sequences=1)
            return result[0]['generated_text']
        except:
            return f"A {diagram_type} diagram containing: {', '.join(elements)}"
