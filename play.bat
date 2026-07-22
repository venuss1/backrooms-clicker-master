@echo off
title Backrooms Clicker
cd /d "%~dp0"

echo ============================================
echo        BACKROOMS CLICKER - LAUNCHER
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Choose the "LTS" version and install it.
    echo Then double-click play.bat again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found.
echo.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo First launch detected. Installing dependencies...
    echo This may take a minute. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed.
    echo.
)

echo Starting game server...
echo.
echo The game will open in your browser automatically.
echo If it doesn't, go to: http://localhost:5173
echo.
echo Press Ctrl+C in this window to stop the server.
echo ============================================
echo.

call npm run dev

pause
