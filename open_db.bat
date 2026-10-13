@echo off
set DB_PATH=%~dp0nutiyala.db

if exist "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe" (
    start "" "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe" "%DB_PATH%"
    exit /b 0
)

if exist "C:\Program Files (x86)\DB Browser for SQLite\DB Browser for SQLite.exe" (
    start "" "C:\Program Files (x86)\DB Browser for SQLite\DB Browser for SQLite.exe" "%DB_PATH%"
    exit /b 0
)

echo Opening nutiyala.db with default system viewer...
start "" "%DB_PATH%"
