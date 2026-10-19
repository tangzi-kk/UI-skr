@echo off
chcp 65001 >nul 2>&1
title 2026 年度一天总结看板 - 本地服务器
echo ==========================================
echo   2026 年度一天总结看板 - 离线版
echo ==========================================
echo.
echo 正在启动本地服务器...
echo.

:: 尝试 Python 3
where python >nul 2>&1
if %errorlevel%==0 (
    echo 使用 Python 启动服务器（端口 8080）
    echo 浏览器将自动打开 http://localhost:8080
    echo 关闭此窗口即可停止服务
    echo.
    start "" http://localhost:8080
    python -m http.server 8080 --bind 127.0.0.1
    goto :eof
)

:: 尝试 py 启动器
where py >nul 2>&1
if %errorlevel%==0 (
    echo 使用 Python 启动服务器（端口 8080）
    echo 浏览器将自动打开 http://localhost:8080
    echo 关闭此窗口即可停止服务
    echo.
    start "" http://localhost:8080
    py -m http.server 8080 --bind 127.0.0.1
    goto :eof
)

:: 尝试 Node.js
where node >nul 2>&1
if %errorlevel%==0 (
    echo 使用 Node.js 启动服务器（端口 8080）
    echo 浏览器将自动打开 http://localhost:8080
    echo 关闭此窗口即可停止服务
    echo.
    start "" http://localhost:8080
    node "%~dp0serve.js"
    goto :eof
)

echo.
echo [错误] 未检测到 Python 或 Node.js
echo.
echo 请安装以下任意一个后重试：
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo 或者手动启动：
echo   python -m http.server 8080
echo   然后在浏览器打开 http://localhost:8080
echo.
pause
