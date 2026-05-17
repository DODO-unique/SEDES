@echo off
echo =======================================================
echo          SEDES Project - Dev Server Launcher
echo =======================================================
echo.

echo Starting Frontend (Vite) in a new window...
start "SEDES Frontend" cmd /k "cd new_gen\frontend\sedes-frontend && npm run dev"

echo Starting Backend (Uvicorn) in a new window...
start "SEDES Backend" cmd /k "cd new_gen\backend && python3 -m uvicorn main:app --reload"

start "SEDES Postgres Docker" cmd /k "start_docker.bat"

start http://localhost:5173/

echo.
echo Both servers are starting up in separate terminal windows!
echo Keep those separate windows open while you are developing.
pause
