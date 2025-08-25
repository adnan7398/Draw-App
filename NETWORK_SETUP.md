# 🌐 Draw-App Network Setup Guide

## 🎯 Running Draw-App on Multiple Devices

Your Draw-App is already configured to work over the network! Here's how to set it up:

### 📱 Prerequisites
- Both laptops connected to the same WiFi network
- All services running on your main laptop

### 🚀 Quick Start

1. **Start the App** (on your laptop):
   ```bash
   cd /Users/adnan/Desktop/Draw-App
   pnpm run dev
   ```

2. **Find Your IP Address**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for an IP like `192.168.x.x` or `10.0.x.x`

3. **Share with Friend**:
   - Tell your friend to open: `http://YOUR_IP:3001`
   - Example: `http://192.168.1.100:3001`

### 🔧 Network Configuration

Your app is already configured to:
- ✅ Frontend: Listen on `0.0.0.0:3001` (accessible from network)
- ✅ HTTP Backend: Listen on `0.0.0.0:3002` (accessible from network)
- ✅ WebSocket: Listen on `0.0.0.0:8081` (accessible from network)
- ✅ Auto-detect hostname for API calls

### 📋 Step-by-Step Instructions

#### On Your Laptop (Host):
1. Open terminal
2. Navigate to project: `cd /Users/adnan/Desktop/Draw-App`
3. Start the app: `pnpm run dev`
4. Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
5. Share the URL with your friend

#### On Your Friend's Laptop:
1. Open any web browser
2. Go to: `http://YOUR_IP:3001`
3. Create an account or sign in
4. Create or join a room
5. Start drawing together! 🎨

### 🌐 URLs for Different Services

- **Frontend**: `http://YOUR_IP:3001`
- **Backend API**: `http://YOUR_IP:3002`
- **WebSocket**: `ws://YOUR_IP:8081`
- **ML Backend**: `http://YOUR_IP:3003`

### 🔍 Troubleshooting

#### If it doesn't work:
1. **Check Firewall**: Make sure your laptop's firewall allows connections on ports 3001, 3002, 8081
2. **Check Network**: Ensure both devices are on the same WiFi network
3. **Check Services**: Make sure all services are running (`pnpm run dev`)
4. **Try Different Browser**: Sometimes browser security blocks local connections

#### Common Issues:
- **Connection Refused**: Check if services are running
- **Page Not Found**: Check the IP address and port
- **WebSocket Error**: Make sure port 8081 is accessible

### 🎨 Features Available Over Network

- ✅ Real-time collaborative drawing
- ✅ User authentication (signup/signin)
- ✅ Room creation and joining
- ✅ Color selection and styling
- ✅ All drawing tools (pencil, shapes, text)
- ✅ AI features (if ML backend is running)

### 📱 Mobile Access

The app should also work on mobile devices connected to the same network!

---

**Happy Drawing! 🎨✨**
