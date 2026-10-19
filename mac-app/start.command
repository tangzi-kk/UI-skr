#!/bin/bash
cd "$(dirname "$0")"

echo "=========================================="
echo "  年度看板 - 离线版"
echo "=========================================="
echo ""

# 优先使用 Node.js（支持飞书 Base 双向同步 API）
if command -v node &> /dev/null; then
    echo "使用 Node.js 启动服务器（端口 8080，支持飞书实时同步）"
    echo "浏览器将自动打开 http://localhost:8080"
    echo "按 Ctrl+C 停止服务"
    echo ""
    (sleep 1 && open "http://localhost:8080") &
    node serve.js
    exit 0
fi

# 备用：Python 3（仅静态浏览，无同步接口）
if command -v python3 &> /dev/null; then
    echo "使用 Python 3 启动静态服务器（端口 8080）"
    echo "浏览器将自动打开 http://localhost:8080"
    echo "按 Ctrl+C 停止服务"
    echo ""
    (sleep 1 && open "http://localhost:8080") &
    python3 -m http.server 8080 --bind 127.0.0.1
    exit 0
fi

echo ""
echo "[错误] 未检测到 Python 或 Node.js"
echo ""
echo "请安装以下任意一个后重试："
echo "  - Python 3: brew install python3"
echo "  - Node.js:  brew install node"
echo ""
echo "或者手动启动："
echo "  python3 -m http.server 8080"
echo "  然后在浏览器打开 http://localhost:8080"
echo ""
read -p "按回车键退出..."
