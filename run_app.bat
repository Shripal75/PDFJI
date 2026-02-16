@echo off
title PDFji Launcher
echo Starting PDFji Backend...
start "PDFji Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo Starting PDFji Frontend...
start "PDFji Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==================================================
echo PDFji is starting!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Please wait a moment for services to initialize...
echo ==================================================
echo.
pause
