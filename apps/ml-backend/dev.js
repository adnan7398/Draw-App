#!/usr/bin/env node
/**
 * Development server script for ML Backend
 * This allows the Python service to work with pnpm/turbo
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.PORT || 3003;
const HOST = process.env.HOST || '0.0.0.0';

// Paths
const ML_BACKEND_DIR = __dirname;
const VENV_PATH = path.join(ML_BACKEND_DIR, 'venv');
const REQUIREMENTS_PATH = path.join(ML_BACKEND_DIR, 'requirements.txt');

// Determine Python executable path
function getPythonPath() {
    if (process.platform === 'win32') {
        return path.join(VENV_PATH, 'Scripts', 'python.exe');
    }
    return path.join(VENV_PATH, 'bin', 'python');
}

// Check if virtual environment exists
function checkVirtualEnv() {
    if (!fs.existsSync(VENV_PATH)) {
        console.log('❌ Virtual environment not found. Running setup...');
        return false;
    }
    return true;
}

// Check if requirements are installed
function checkRequirements() {
    const pythonPath = getPythonPath();
    if (!fs.existsSync(pythonPath)) {
        console.log('❌ Python not found in virtual environment');
        return false;
    }
    return true;
}

// Run setup if needed
function runSetup() {
    console.log('🚀 Setting up ML Backend...');
    
    const setupScript = path.join(ML_BACKEND_DIR, 'setup-simple.py');
    if (fs.existsSync(setupScript)) {
        console.log('📦 Running Python setup script...');
        const setup = spawn('python3', [setupScript], {
            cwd: ML_BACKEND_DIR,
            stdio: 'inherit'
        });
        
        setup.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Setup completed successfully');
                startServer();
            } else {
                console.error('❌ Setup failed');
                process.exit(1);
            }
        });
    } else {
        console.log('📦 Running manual setup...');
        manualSetup();
    }
}

// Manual setup using npm scripts
function manualSetup() {
    console.log('📦 Creating virtual environment...');
    const createVenv = spawn('python3', ['-m', 'venv', 'venv'], {
        cwd: ML_BACKEND_DIR,
        stdio: 'inherit'
    });
    
    createVenv.on('close', (code) => {
        if (code === 0) {
            console.log('📥 Installing dependencies...');
            const pipPath = process.platform === 'win32' 
                ? path.join(VENV_PATH, 'Scripts', 'pip.exe')
                : path.join(VENV_PATH, 'bin', 'pip');
            
            const install = spawn(pipPath, ['install', '-r', 'requirements-simple.txt'], {
                cwd: ML_BACKEND_DIR,
                stdio: 'inherit'
            });
            
            install.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Setup completed successfully');
                    startServer();
                } else {
                    console.error('❌ Dependency installation failed');
                    process.exit(1);
                }
            });
        } else {
            console.error('❌ Virtual environment creation failed');
            process.exit(1);
        }
    });
}

// Start the FastAPI server
function startServer() {
    console.log('🎯 Starting ML Backend server...');
    console.log(`📍 Server will be available at: http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔍 API docs: http://${HOST}:${PORT}/docs`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
    
    const pythonPath = getPythonPath();
    const uvicornArgs = [
        '-m', 'uvicorn',
        'src.main-simple:app',
        '--reload',
        '--host', HOST,
        '--port', PORT.toString()
    ];
    
    // Set environment variables to ensure we use the virtual environment
    const env = { 
        ...process.env, 
        PYTHONPATH: ML_BACKEND_DIR,
        VIRTUAL_ENV: VENV_PATH,
        PATH: `${path.dirname(pythonPath)}:${process.env.PATH}`
    };
    
    const server = spawn(pythonPath, uvicornArgs, {
        cwd: ML_BACKEND_DIR,
        stdio: 'inherit',
        env: env
    });
    
    server.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    });
    
    server.on('close', (code) => {
        if (code !== 0) {
            console.error(`❌ Server exited with code ${code}`);
            process.exit(code);
        }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.kill('SIGINT');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        server.kill('SIGTERM');
        process.exit(0);
    });
}

// Main execution
function main() {
    console.log('🧠 ML Backend Development Server');
    console.log('=' * 40);
    
    // Check if we're in the right directory
    if (!fs.existsSync(REQUIREMENTS_PATH)) {
        console.error('❌ requirements.txt not found. Please run this from the ml-backend directory.');
        process.exit(1);
    }
    
    // Check Python installation
    const pythonCheck = spawn('python3', ['--version'], { stdio: 'pipe' });
    pythonCheck.on('error', () => {
        console.error('❌ Python 3 is not installed or not in PATH');
        console.error('Please install Python 3.9+ and try again');
        process.exit(1);
    });
    
    pythonCheck.on('close', (code) => {
        if (code === 0) {
            if (checkVirtualEnv() && checkRequirements()) {
                startServer();
            } else {
                runSetup();
            }
        } else {
            console.error('❌ Python version check failed');
            process.exit(1);
        }
    });
}

if (require.main === module) {
    main();
}

module.exports = { main, startServer, runSetup };
