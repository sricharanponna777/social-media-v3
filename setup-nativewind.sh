#!/bin/bash

echo "🌀 Starting NativeWind setup..."

# 1. Install NativeWind and its peer dependencies
echo "📦 Installing NativeWind and dependencies..."
pnpm add nativewind

# 2. Install peer dependencies for NativeWind
pnpm add tailwindcss -D

# 3. Create tailwind.config.js
echo "🛠️ Creating tailwind.config.js..."
pnpm dlx tailwindcss init

# 4. Update tailwind.config.js
echo "🔧 Configuring tailwind.config.js..."
cat > tailwind.config.js <<EOL
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL


# 6. Add NativeWind babel plugin
echo "🔁 Updating babel.config.js..."
if grep -q "plugins" babel.config.js; then
  sed -i '' 's/plugins: \[/plugins: \[\n    "nativewind",/' babel.config.js
else
  sed -i '' 's/module.exports = {/module.exports = {\n  plugins: ["nativewind"],/' babel.config.js
fi

# 7. Create global.css (Expo)
echo "📦 Creating global.css (optional for Expo Web)..."
mkdir -p styles
cat > styles/global.css <<EOL
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# 8. Reminder for using `className` in components
echo "✅ Setup complete! You can now use Tailwind classes in React Native components using the className prop."

