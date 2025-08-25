#!/bin/bash

echo "🎨 Draw-App Network Setup"
echo "=========================="

# Get the local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo "📱 Your local IP address is: $LOCAL_IP"
echo ""
echo "🌐 To access Draw-App from other devices on the same network:"
echo "   Frontend: http://$LOCAL_IP:3001"
echo "   Backend:  http://$LOCAL_IP:3002"
echo "   WebSocket: ws://$LOCAL_IP:8081"
echo ""
echo "📋 Instructions for your friend:"
echo "1. Make sure both laptops are connected to the same WiFi network"
echo "2. Open browser and go to: http://$LOCAL_IP:3001"
echo "3. Create an account or sign in"
echo "4. Create or join a room to start drawing together!"
echo ""
echo "🔧 If you need to find your IP address later, run: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
echo ""
echo "🚀 Starting Draw-App..."
echo "=========================="
