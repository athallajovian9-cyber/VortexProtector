@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo   Vortex Protector - Discord Server Protection Bot
echo   Wick-style anti-raid, anti-spam, anti-nuke protection
echo ============================================================
echo.
echo Starting bot...
node src/index.js
pause