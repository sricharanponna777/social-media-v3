#!/bin/bash

echo "🧹 Reverting NativeWind setup..."

# 1. Remove NativeWind and Tailwind
echo "🗑️ Removing packages..."
pnpm uninstall nativewind
pnpm uninstall tailwindcss

# 2. Delete config files
echo "🧾 Deleting config files..."
rm -f tailwind.config.js
rm -f nativewind.config.js
rm -rf styles/global.css
rmdir styles 2>/dev/null

# 3. Remove "nativewind" from babel.config.js
echo "🧼 Cleaning babel.config.js..."
if grep -q '"nativewind"' babel.config.js; then
  sed -i '' '/"nativewind",*/d' babel.config.js
fi

echo "✅ NativeWind has been fully removed from your project."
