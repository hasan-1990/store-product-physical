@echo off
REM Test runner for Domain Lock System
echo ===================================
echo Duplicator Domain Lock System Test
echo ===================================
echo.

REM پیدا کردن PHP
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP not found in PATH
    echo.
    echo Please install PHP or add it to your PATH
    echo Download: https://www.php.net/downloads
    pause
    exit /b 1
)

echo [OK] PHP found
php -v
echo.

REM اجرای تست
echo Running tests...
echo.
php test-system.php

pause
