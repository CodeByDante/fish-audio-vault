@echo off
title Fish Audio - Activar Auto-Inicio y Accesos Directos
cls
echo ===================================================
echo   Configurando Accesos Directos y Servidor Local
echo ===================================================
echo.
cd /d "%~dp0"

REM 1. Crear accesos directos en Inicio de Windows y Escritorio
cscript //nologo setup_startup.vbs
echo [OK] Acceso directo registrado en Inicio de Windows.
echo [OK] Acceso directo creado en el Escritorio (Fish Audio Voice Vault.lnk).

REM 2. Ejecutar servidor inmediatamente en segundo plano
start "" wscript.exe "%~dp0Iniciar_SegundoPlano.vbs"
echo [OK] Servidor activado en segundo plano (http://localhost:8080).
echo.
echo ===================================================
echo Todo listo. Tienes un acceso directo universal en tu
echo Escritorio y el servidor se iniciara solo al prender tu PC.
echo ===================================================
echo.
pause
