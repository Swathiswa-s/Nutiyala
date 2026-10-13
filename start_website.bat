@echo off
title Nutiyala Couture Server
echo ========================================================
echo Starting Nutiyala Couture Luxury E-Commerce Platform...
echo ========================================================
echo.
echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/
echo.
echo Server active at: http://localhost:5173/
echo Press Ctrl+C to stop the server at any time.
python serve.py
pause
