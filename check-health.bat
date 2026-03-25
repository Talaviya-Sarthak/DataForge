@echo off
echo ========================================
echo DataForge - Quick Health Check
echo ========================================
echo.

echo [1/5] Checking Backend files...
if exist "Backend\package.json" (
    echo   ✓ Backend package.json found
) else (
    echo   ✗ Backend package.json missing
)

if exist "Backend\.env" (
    echo   ✓ Backend .env found
) else (
    echo   ✗ Backend .env missing - Copy from .env.example
)

if exist "Backend\server.js" (
    echo   ✓ Backend server.js found
) else (
    echo   ✗ Backend server.js missing
)

echo.
echo [2/5] Checking Frontend files...
if exist "Frontend\package.json" (
    echo   ✓ Frontend package.json found
) else (
    echo   ✗ Frontend package.json missing
)

if exist "Frontend\src\App.tsx" (
    echo   ✓ Frontend App.tsx found
) else (
    echo   ✗ Frontend App.tsx missing
)

echo.
echo [3/5] Checking MLService files...
if exist "MLService\run.py" (
    echo   ✓ MLService run.py found
) else (
    echo   ✗ MLService run.py missing
)

if exist "MLService\requirements.txt" (
    echo   ✓ MLService requirements.txt found
) else (
    echo   ✗ MLService requirements.txt missing
)

echo.
echo [4/5] Checking Database schema...
if exist "Backend\Database\schema.sql" (
    echo   ✓ Database schema.sql found
) else (
    echo   ✗ Database schema.sql missing
)

echo.
echo [5/5] Checking node_modules...
if exist "Backend\node_modules" (
    echo   ✓ Backend dependencies installed
) else (
    echo   ✗ Backend dependencies missing - Run: cd Backend ^&^& npm install
)

if exist "Frontend\node_modules" (
    echo   ✓ Frontend dependencies installed
) else (
    echo   ✗ Frontend dependencies missing - Run: cd Frontend ^&^& npm install
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Ensure .env file exists in Backend folder
echo 2. Start MySQL and create database
echo 3. Start Redis server
echo 4. Install Python dependencies: cd MLService ^&^& pip install -r requirements.txt
echo 5. See TESTING_CHECKLIST.md for detailed testing guide
echo.
echo To start services:
echo   Terminal 1: cd Backend ^&^& npm start
echo   Terminal 2: cd Backend ^&^& npm run worker
echo   Terminal 3: cd MLService ^&^& python run.py
echo   Terminal 4: cd Frontend ^&^& npm run dev
echo.
pause
