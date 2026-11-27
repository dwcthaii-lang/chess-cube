@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Co va Rubik
where node >nul 2>nul
if errorlevel 1 (
  echo [!] May chua cai Node.js. Hay tai ban LTS tai https://nodejs.org roi bam lai file nay.
  start https://nodejs.org
  pause
  exit /b
)
if not exist node_modules (
  echo Lan dau chay: dang cai dat thu vien, vui long doi 1-2 phut...
  call npm install
  if errorlevel 1 (
    echo [!] Cai dat that bai. Kiem tra ket noi mang roi thu lai.
    pause
    exit /b
  )
)
echo Dang khoi dong Co va Rubik... Trinh duyet se tu mo http://localhost:5175
echo (Giu cua so nay mo trong luc hoc. Dong cua so = tat web.)
call npm start
pause
