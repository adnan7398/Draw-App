#!/usr/bin/env python3
"""
Simplified setup script for ML Backend - minimal dependencies first
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        print(f"✅ {command}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {command} failed: {e.stderr}")
        return None

def check_python():
    """Check Python version and installation"""
    print("🐍 Checking Python installation...")
    
    if sys.version_info < (3, 9):
        print(f"❌ Python 3.9+ required. Current version: {sys.version}")
        return False
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def setup_virtual_environment():
    """Set up Python virtual environment"""
    print("📦 Setting up virtual environment...")
    
    venv_path = Path("venv")
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    # Create virtual environment
    result = run_command("python3 -m venv venv")
    if result is None:
        return False
    
    print("✅ Virtual environment created")
    return True

def install_basic_dependencies():
    """Install basic dependencies first"""
    print("📥 Installing basic dependencies...")
    
    # Determine pip path based on OS
    if platform.system() == "Windows":
        pip_path = "venv\\Scripts\\pip"
    else:
        pip_path = "venv/bin/pip"
    
    # Upgrade pip first
    run_command(f"{pip_path} install --upgrade pip")
    
    # Install basic packages one by one
    basic_packages = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0", 
        "python-multipart==0.0.6",
        "pillow==10.1.0",
        "numpy==1.24.3",
        "python-dotenv==1.0.0"
    ]
    
    for package in basic_packages:
        print(f"📦 Installing {package}...")
        result = run_command(f"{pip_path} install {package}")
        if result is None:
            print(f"⚠️ Failed to install {package}, continuing...")
    
    return True

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    directories = ["models", "logs"]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created {directory}/ directory")
    
    return True

def setup_environment():
    """Set up environment file"""
    print("⚙️ Setting up environment...")
    
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if not env_file.exists() and env_example.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from template")
        print("📝 Please edit .env file with your configuration")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("⚠️ No env.example file found")
    
    return True

def test_installation():
    """Test if the basic installation works"""
    print("🧪 Testing installation...")
    
    try:
        # Try to import basic packages
        import fastapi
        import uvicorn
        import PIL
        import numpy
        print("✅ Basic packages imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Import test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 ML Backend Simplified Setup")
    print("=" * 40)
    
    # Change to ML backend directory
    ml_backend_dir = Path(__file__).parent
    os.chdir(ml_backend_dir)
    
    print(f"📂 Working directory: {os.getcwd()}")
    
    # Run setup steps
    if not check_python():
        sys.exit(1)
    
    if not setup_virtual_environment():
        sys.exit(1)
    
    if not install_basic_dependencies():
        print("⚠️ Some dependencies failed to install, but continuing...")
    
    if not create_directories():
        sys.exit(1)
    
    if not setup_environment():
        sys.exit(1)
    
    if not test_installation():
        print("⚠️ Installation test failed, but you can try running the service")
    
    print("\n" + "=" * 40)
    print("✅ ML Backend basic setup completed!")
    print("\n🚀 To start the service:")
    print("   cd apps/ml-backend")
    print("   source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
    print("   python3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 3003")
    print("\n🌐 Or use pnpm from monorepo root:")
    print("   pnpm --filter ml-backend dev")
    print("\n📚 See ML_BACKEND_SETUP.md for more details")

if __name__ == "__main__":
    main()
