#!/usr/bin/env python3
"""
Test script for Draw-App AI Features
Tests: Shape Recognition, Diagram Detection, OCR, AI Assistant
"""

import requests
import json
import time
from PIL import Image, ImageDraw
import numpy as np
import io
import base64

BASE_URL = "http://localhost:3003"

def create_test_image():
    """Create a simple test image with shapes"""
    # Create a white image
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw some test shapes
    draw.rectangle([50, 50, 150, 100], outline='black', width=2)  # Rectangle
    draw.ellipse([200, 50, 300, 100], outline='black', width=2)  # Circle
    draw.polygon([(100, 200), (150, 150), (200, 200)], outline='black', width=2)  # Triangle
    
    # Add some text
    draw.text((50, 250), "Test Drawing", fill='black')
    
    return img

def test_health():
    """Test health endpoint"""
    print("🏥 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"   Version: {data['version']}")
            print(f"   Services: {list(data['services'].keys())}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_ai_capabilities():
    """Test AI capabilities endpoint"""
    print("\n🔍 Testing AI Capabilities...")
    try:
        response = requests.get(f"{BASE_URL}/ai/capabilities")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI capabilities retrieved")
            print(f"   Available features: {list(data['ai_features'].keys())}")
            return True
        else:
            print(f"❌ AI capabilities failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI capabilities error: {e}")
        return False

def test_shape_recognition():
    """Test shape recognition"""
    print("\n🔷 Testing Shape Recognition...")
    try:
        # Create test image
        test_img = create_test_image()
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        test_img.save(img_buffer, format='PNG')
        img_data = img_buffer.getvalue()
        
        # Send request
        files = {'image': ('test.png', img_data, 'image/png')}
        data = {'clean_shapes': True}
        
        response = requests.post(f"{BASE_URL}/ai/shape-recognition", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Shape recognition successful")
            print(f"   Shapes detected: {result['shapes_detected']}")
            print(f"   Shapes: {[s['type'] for s in result['shapes']]}")
            print(f"   Cleaned shapes: {result['cleaned_shapes']}")
            return True
        else:
            print(f"❌ Shape recognition failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Shape recognition error: {e}")
        return False

def test_diagram_detection():
    """Test diagram detection"""
    print("\n📊 Testing Diagram Detection...")
    try:
        # Create test image
        test_img = create_test_image()
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        test_img.save(img_buffer, format='PNG')
        img_data = img_buffer.getvalue()
        
        # Send request
        files = {'image': ('test.png', img_data, 'image/png')}
        data = {'clean_diagram': False}
        
        response = requests.post(f"{BASE_URL}/ai/diagram-detection", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Diagram detection successful")
            print(f"   Diagram type: {result['diagram_type']}")
            print(f"   Confidence: {result['confidence']:.2f}")
            return True
        else:
            print(f"❌ Diagram detection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Diagram detection error: {e}")
        return False

def test_ai_assistant():
    """Test AI assistant features"""
    print("\n🤖 Testing AI Assistant...")
    try:
        # Test diagram suggestion
        data = {'description': 'Create a process workflow for user registration'}
        response = requests.post(f"{BASE_URL}/ai/suggest-diagram", data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Diagram suggestion successful")
            print(f"   Suggested: {result['suggested_diagram']}")
            print(f"   Confidence: {result['confidence']:.2f}")
        else:
            print(f"❌ Diagram suggestion failed: {response.status_code}")
            return False
        
        # Test icon suggestions
        data = {'context': 'business technology'}
        response = requests.post(f"{BASE_URL}/ai/suggest-icons", data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Icon suggestions successful")
            print(f"   Icons: {result['suggested_icons']}")
        else:
            print(f"❌ Icon suggestions failed: {response.status_code}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ AI assistant error: {e}")
        return False

def test_complete_analysis():
    """Test complete AI analysis"""
    print("\n🔬 Testing Complete AI Analysis...")
    try:
        # Create test image
        test_img = create_test_image()
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        test_img.save(img_buffer, format='PNG')
        img_data = img_buffer.getvalue()
        
        # Send request
        files = {'image': ('test.png', img_data, 'image/png')}
        data = {
            'include_ocr': True,
            'include_shape_recognition': True,
            'include_diagram_detection': True
        }
        
        response = requests.post(f"{BASE_URL}/ai/complete-analysis", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Complete analysis successful")
            print(f"   Image dimensions: {result['image_info']['dimensions']}")
            print(f"   Analysis components: {list(result['analysis'].keys())}")
            return True
        else:
            print(f"❌ Complete analysis failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Complete analysis error: {e}")
        return False

def main():
    """Run all AI feature tests"""
    print("🧠 Draw-App AI Features Test Suite")
    print("=" * 50)
    
    # Wait for service to be ready
    print("⏳ Waiting for ML backend to be ready...")
    time.sleep(3)
    
    tests = [
        ("Health Check", test_health),
        ("AI Capabilities", test_ai_capabilities),
        ("Shape Recognition", test_shape_recognition),
        ("Diagram Detection", test_diagram_detection),
        ("AI Assistant", test_ai_assistant),
        ("Complete Analysis", test_complete_analysis)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"⚠️ {test_name} test failed")
        except Exception as e:
            print(f"❌ {test_name} test error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All AI features are working correctly!")
    else:
        print("⚠️ Some AI features need attention")
    
    print(f"\n🌐 API Documentation: {BASE_URL}/docs")
    print(f"🔍 Health Check: {BASE_URL}/health")

if __name__ == "__main__":
    main()
