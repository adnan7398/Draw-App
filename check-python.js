#!/usr/bin/env node
/**
 * Python Requirements Checker for Draw-App Monorepo
 * Run this from the monorepo root to check Python setup
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ML_BACKEND_DIR = path.join(__dirname, 'apps', 'ml-backend');

function checkPythonInstallation() {
    return new Promise((resolve) => {
        console.log('🐍 Checking Python installation...');
        
        const pythonCheck = spawn('python3', ['--version'], { stdio: 'pipe' });
        
        pythonCheck.on('error', () => {
            console.log('❌ Python 3 is not installed or not in PATH');
            console.log('Please install Python 3.9+ and try again');
            resolve(false);
        });
        
        pythonCheck.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Python 3 is available');
                resolve(true);
            } else {
                console.log('❌ Python version check failed');
                resolve(false);
            }
        });
    });
}

function checkMLBackendSetup() {
    return new Promise((resolve) => {
        console.log('🧠 Checking ML Backend setup...');
        
        const venvPath = path.join(ML_BACKEND_DIR, 'venv');
        const requirementsPath = path.join(ML_BACKEND_DIR, 'requirements.txt');
        
        if (!fs.existsSync(requirementsPath)) {
            console.log('❌ ML Backend requirements.txt not found');
            resolve(false);
            return;
        }
        
        if (!fs.existsSync(venvPath)) {
            console.log('❌ ML Backend virtual environment not found');
            console.log('Run: pnpm --filter ml-backend setup');
            resolve(false);
            return;
        }
        
        console.log('✅ ML Backend appears to be set up');
        resolve(true);
    });
}

function runSetup() {
    return new Promise((resolve) => {
        console.log('🚀 Running ML Backend setup...');
        
        const setup = spawn('pnpm', ['--filter', 'ml-backend', 'setup'], {
            stdio: 'inherit',
            cwd: __dirname
        });
        
        setup.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Setup completed successfully');
                resolve(true);
            } else {
                console.log('❌ Setup failed');
                resolve(false);
            }
        });
    });
}

async function main() {
    console.log('🔍 Python Requirements Checker for Draw-App');
    console.log('=' * 50);
    
    // Check Python installation
    const pythonOk = await checkPythonInstallation();
    if (!pythonOk) {
        console.log('\n💡 To install Python:');
        console.log('   macOS: brew install python@3.9');
        console.log('   Ubuntu: sudo apt install python3.9 python3.9-venv');
        console.log('   Windows: Download from https://python.org');
        process.exit(1);
    }
    
    // Check ML Backend setup
    const mlBackendOk = await checkMLBackendSetup();
    if (!mlBackendOk) {
        console.log('\n💡 To set up ML Backend:');
        console.log('   pnpm --filter ml-backend setup');
        console.log('   pnpm --filter ml-backend dev');
        process.exit(1);
    }
    
    console.log('\n✅ All checks passed!');
    console.log('\n🚀 You can now start the ML Backend with:');
    console.log('   pnpm --filter ml-backend dev');
    console.log('\n🌐 Or start all services with:');
    console.log('   pnpm run dev');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkPythonInstallation, checkMLBackendSetup, runSetup };
