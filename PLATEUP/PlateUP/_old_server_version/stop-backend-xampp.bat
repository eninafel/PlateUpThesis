@echo off
set "XAMPP=C:\xampp"
"%XAMPP%\mysql\bin\mysqladmin.exe" -uroot shutdown
echo MySQL stopped. Close the backend window too.
pause
