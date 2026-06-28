@echo off
start /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Admin\AppData\Local\Temp\opencode\overnight_master.ps1" -TargetMin 10GB -TargetMax 12GB -MaxParallel 8
echo Overnight scraper started.
