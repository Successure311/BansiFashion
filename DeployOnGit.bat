@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===================================
echo  Bansi Fashion - Deploy via Git
echo ===================================
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo This folder is not a git repository, or git is not installed.
  pause
  exit /b 1
)

set HAS_CHANGES=
for /f "delims=" %%i in ('git status --porcelain') do set HAS_CHANGES=1

if not defined HAS_CHANGES (
  echo No changes to deploy - working tree is clean.
  pause
  exit /b 0
)

echo Changed files:
git status --short
echo.

set MSG=
set /p MSG="Commit message (leave blank for default): "
if "%MSG%"=="" set MSG=Update Bansi Fashion app

git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo Commit failed - see the error above.
  pause
  exit /b 1
)

git push
if errorlevel 1 (
  echo.
  echo Push failed - check your internet connection or GitHub login.
  pause
  exit /b 1
)

echo.
echo Pushed to GitHub. Netlify will auto-build and deploy in a minute or two.
echo Site: https://bansifashion.netlify.app/
echo.
pause
