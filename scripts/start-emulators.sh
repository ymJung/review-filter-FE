#!/bin/bash

echo "Starting Firebase emulators for testing..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Start Firebase emulators
echo "Starting Firebase emulators..."
firebase emulators:start --only auth,firestore,storage,functions &

# Wait for emulators to start
echo "Waiting for emulators to start..."
sleep 10

# Check if emulators are running
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Firestore emulator is running on port 8080"
else
    echo "❌ Firestore emulator failed to start"
fi

if curl -s http://localhost:9099 > /dev/null; then
    echo "✅ Auth emulator is running on port 9099"
else
    echo "❌ Auth emulator failed to start"
fi

if curl -s http://localhost:9199 > /dev/null; then
    echo "✅ Storage emulator is running on port 9199"
else
    echo "❌ Storage emulator failed to start"
fi

if curl -s http://localhost:5001 > /dev/null; then
    echo "✅ Functions emulator is running on port 5001"
else
    echo "❌ Functions emulator failed to start"
fi

echo "Firebase emulators are ready for testing!"
echo "Emulator UI available at: http://localhost:4000"