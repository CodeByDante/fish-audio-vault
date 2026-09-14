@echo off
title Fish Audio - Servidor de Sincronizacion
cls
echo ===================================================
echo   Iniciando Servidor de Auto-Guardado
echo ===================================================
echo.
cd /d "%~dp0"
set PYTHONDONTWRITEBYTECODE=1
python -B server.py
pause
