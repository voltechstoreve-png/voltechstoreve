/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        voltech: {
          cyan: '#00d4ff',
          purple: '#bf00ff',
          dark: '#0a0a0f',
          surface: '#12121a',
          border: '#1e1e2e',
          success: '#00ff88',
          warning: '#ffaa00',
          error: '#ff3366',
          text: '#ffffff',
          muted: '#a0a0b0',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 212, 255, 0.4)',
        'neon-purple': '0 0 15px rgba(191, 0, 255, 0.4)',
      },
    },
  },
  plugins: [],
};