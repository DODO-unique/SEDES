@echo off
:: 1. Check if Docker Desktop is already running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Docker Desktop is already running.
) else (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    :: 2. Wait for the Docker Engine to be ready
    echo Waiting for Docker Engine to start...
    :wait_docker
    docker info >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        timeout /t 2 /nobreak >nul
        goto wait_docker
    )
    echo Docker Engine is ready!
)

:: 3. Start your Docker image
echo Starting your container...
docker start sedes
