@echo off
REM Quick Start Script for SoundMind Application
REM This script helps setup and run the application on Windows

setlocal enabledelayedexpansion

echo.
echo ================================
echo   SoundMind - Quick Start Setup
echo ================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.12+ from https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Node.js and Python found
echo.

REM Setup Backend
echo ================================
echo Setting up Backend...
echo ================================
cd Backend
echo Installing npm packages...
call npm install
echo.
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo [OK] Backend setup complete
cd..

REM Setup Frontend
echo ================================
echo Setting up Frontend...
echo ================================
cd frontend
echo Installing npm packages...
call npm install
echo.
echo [OK] Frontend setup complete
cd..

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Open two terminals/command prompts
echo.
echo Terminal 1 - Start Backend:
echo   cd Backend
echo   npm start
echo.
echo Terminal 2 - Start Frontend:
echo   cd frontend
echo   npm start
echo.
echo The application will open at http://localhost:3000
echo.
pause
