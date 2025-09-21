@echo off
echo Starting Real-Time Chat Application...
echo.

echo [1/2] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"

echo [2/2] Starting Frontend Development Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul