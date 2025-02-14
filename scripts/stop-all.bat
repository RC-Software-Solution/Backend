@echo off
echo Stopping all microservices...

:: Define the list of service ports
set PORTS=4000 4001

for %%P in (%PORTS%) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P"') do (
        echo Killing process on port %%P (PID: %%A)...
        taskkill /PID %%A /F
    )
)

echo All services stopped!