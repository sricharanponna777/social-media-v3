// tailwind.config.js
const { join } = require("path");

module.exports = {
  content: [
    join(__dirname, "App.{js,jsx,ts,tsx}"),
    join(__dirname, "app/**/*.{js,jsx,ts,tsx}"),
    join(__dirname, "components/**/*.{js,jsx,ts,tsx}"),
  ],
  presets: [require("nativewind/preset")], // <-- THIS IS REQUIRED
  theme: {
    extend: {},
  },
  plugins: [],
};
