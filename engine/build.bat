@echo off
echo ========================================
echo   Building Faster-Whisper Elite Engine
echo ========================================
echo.
cd /d "%%~dp0"
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Python virtual environment not found at .venv
    echo Run: python -m venv .venv
    echo Then: .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)
echo [1/3] Installing dependencies...
".venv\Scripts\pip.exe" install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo [2/3] Building executable with PyInstaller...
".venv\Scripts\pyinstaller.exe" --noconfirm engine.spec
if errorlevel 1 (
    echo ERROR: PyInstaller build failed
    pause
    exit /b 1
)
echo [3/3] Verifying build...
if exist "dist\engine.exe" (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL
    echo   Output: dist\engine.exe
    echo ========================================
) else (
    echo.
    echo ERROR: dist\engine.exe not found after build
    pause
    exit /b 1
)
pause
