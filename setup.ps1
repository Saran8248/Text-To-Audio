# Quick Start Script for SoundMind Application - PowerShell Version
# This script helps setup and run the application

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  SoundMind - Quick Start Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Node is installed
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.12+ from https://www.python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Set-Location Backend
Write-Host "`nInstalling npm packages..." -ForegroundColor Yellow
npm install

Write-Host "`nInstalling Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "`n[OK] Backend setup complete" -ForegroundColor Green

Set-Location ..

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Set-Location frontend
Write-Host "`nInstalling npm packages..." -ForegroundColor Yellow
npm install

Write-Host "`n[OK] Frontend setup complete" -ForegroundColor Green

Set-Location ..

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open two terminals/command prompts`n" -ForegroundColor White

Write-Host "Terminal 1 - Start Backend:" -ForegroundColor Cyan
Write-Host "  cd Backend" -ForegroundColor White
Write-Host "  npm start`n" -ForegroundColor White

Write-Host "Terminal 2 - Start Frontend:" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm start`n" -ForegroundColor White

Write-Host "The application will open at " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green

Read-Host "`nPress Enter to exit"
