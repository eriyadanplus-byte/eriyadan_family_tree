@echo off
echo Setting up MySQL database for Family Tree...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -proot -e "CREATE DATABASE IF NOT EXISTS family_tree; USE family_tree; source setup-tables.sql"
echo Setup complete!
pause
