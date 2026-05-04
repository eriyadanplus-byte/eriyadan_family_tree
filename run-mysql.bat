@echo off
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -proot -e "CREATE DATABASE IF NOT EXISTS family_tree;"
echo Database created!
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -proot family_tree < setup-tables.sql
echo Tables created!
pause
