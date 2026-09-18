@echo off
cd /d "%~dp0"
echo Starting Amanat House on http://localhost:3000
echo Keep this window open while using the website.
"C:\Program Files\nodejs\node.exe" "%CD%\node_modules\next\dist\bin\next" dev -p 3000
echo.
echo Server stopped. Press any key to close this window.
pause > nul
