#!/usr/bin/env python3
"""
Simple test script for the ML Backend API
"""

import requests
import json
import time

BASE_URL = "http://localhost:3003"

def test_health():
    """Test health endpoints"""
    print("Testing health endpoints...")
    
    # Test root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✓ Root endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")
    
    # Test health endpoint
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✓ Health endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Health endpoint failed: {e}")
    
    # Test models endpoint
    try:
        response = requests.get(f"{BASE_URL}/models/available")
        print(f"✓ Models endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Models endpoint failed: {e}")

def test_drawing_generation():
    """Test drawing generation endpoint"""
    print("\nTesting drawing generation...")
    
    data = {
        "prompt": "a beautiful sunset over mountains",
        "style": "realistic",
        "size": "512x512"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate-drawing", data=data)
        print(f"✓ Drawing generation: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Drawing generation failed: {e}")

def test_enhancement():
    """Test image enhancement endpoint"""
    print("\nTesting image enhancement...")
    
    # Create a simple test image (1x1 pixel)
    from PIL import Image
    import io
    import base64
    
    # Create a simple test image
    test_image = Image.new('RGB', (10, 10), color='red')
    img_buffer = io.BytesIO()
    test_image.save(img_buffer, format='PNG')
    img_data = img_buffer.getvalue()
    
    files = {'image': ('test.png', img_data, 'image/png')}
    data = {'enhancement_type': 'upscale'}
    
    try:
        response = requests.post(f"{BASE_URL}/enhance-drawing", files=files, data=data)
        print(f"✓ Image enhancement: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Image enhancement failed: {e}")

def main():
    """Run all tests"""
    print("🧪 ML Backend API Tests")
    print("=" * 40)
    
    # Wait a bit for the service to start
    print("Waiting for service to be ready...")
    time.sleep(2)
    
    test_health()
    test_drawing_generation()
    test_enhancement()
    
    print("\n" + "=" * 40)
    print("✅ Tests completed!")

if __name__ == "__main__":
    main()
