@echo off
title Fish Audio Voice Vault - Servidor Web Host
cls
echo ===================================================
echo   Iniciando Servidor Web Host Local (http://localhost:8080)
echo ===================================================
echo.
cd /d "%~dp0"
echo Abriendo tu pagina web en el navegador...
start http://localhost:8080/index.html
echo.
echo Servidor Web activo en http://localhost:8080/index.html
echo Presiona Ctrl + C o cierra esta ventana para detener el servidor.
echo.
python -m http.server 8080
pause
