@echo off
echo =======================================================
echo          SEDES Project - Dependency Installer
echo =======================================================
echo.

echo [1/2] Installing Backend Dependencies (Python) ...
cd new_gen\backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing Python dependencies. Please ensure Python/Pip is installed.
    pause
    exit /b %errorlevel%
)
cd ..\..
echo.

echo [2/2] Installing Frontend Dependencies (Node.js) ...
cd new_gen\frontend\sedes-frontend
npm install
if %errorlevel% neq 0 (
    echo Error installing Node dependencies. Please ensure Node.js is installed.
    pause
    exit /b %errorlevel%
)
cd ..\..\..
echo.

echo =======================================================
echo          All installations completed successfully!
echo =======================================================
pause
