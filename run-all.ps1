# InstaMERN Startup Script
# This script launches both the Express backend and the Vite frontend in separate PowerShell windows.

Write-Host "Starting InstaMERN Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; $env:PORT=5000; node server.js"

Write-Host "Starting InstaMERN Frontend Development Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both servers launched successfully!" -ForegroundColor Yellow
Write-Host "Backend is running on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend is running on http://localhost:5173" -ForegroundColor Green
