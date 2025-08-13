#!/bin/bash

echo "🚀 Cleaning Expo iOS build environment..."

# 1️⃣ Remove Xcode DerivedData
echo "🧹 Removing DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData

# 2️⃣ Clean CocoaPods
echo "🧹 Cleaning CocoaPods..."
cd ios || exit
pod deintegrate
pod cache clean --all
rm -rf Pods Podfile.lock
pod install
cd ..

# 3️⃣ Reset Expo native build
echo "🧹 Resetting Expo native build..."
npx expo prebuild --clean

# 4️⃣ Clear pnpm store & reinstall packages
echo "🧹 Clearing pnpm store..."
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install

# 5️⃣ Update CocoaPods repo
echo "⬆️ Updating CocoaPods..."
pod repo update

# 6️⃣ Run build
echo "🏗️ Running iOS build..."
npx expo run:ios --device

echo "✅ Clean build complete!"
