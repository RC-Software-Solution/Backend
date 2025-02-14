@echo off
start cmd /k "cd /d D:\RC\RC-Backend\apps\user-service && nodemon index.js"
start cmd /k "cd /d D:\RC\RC-Backend\apps\api-gateway && nodemon index.js"
@REM start cmd /k "cd /d apps/order-service && nodemon index.js"
echo All services started!
