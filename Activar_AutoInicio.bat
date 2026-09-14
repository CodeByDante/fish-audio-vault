@echo off
title Fish Audio - Activar Auto-Inicio con Windows
cls
echo ===================================================
echo   Configurando Auto-Inicio con Windows
echo ===================================================
echo.
cd /d "%~dp0"

cscript //nologo setup_startup.vbs

echo [OK] Auto-inicio activado con exito.
echo Cada vez que enciendas tu laptop, el servidor se iniciara solo automaticamente.
echo.
pause
