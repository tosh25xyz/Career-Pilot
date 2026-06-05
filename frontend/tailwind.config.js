/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eefaff',
          100: '#d8f2ff',
          200: '#b9e9ff',
          300: '#88dcff',
          400: '#50c8ff',
          500: '#28abfd',
          600: '#0e8ef2',
          700: '#0878df',
          800: '#0d5fb4',
          900: '#11518e',
          950: '#0d3260',
        },
        dark: {
          900: '#080c14',
          800: '#0d1321',
          700: '#121a2e',
          600: '#1a2540',
          500: '#243052',
        },
      },
      fontFamily: {
        display: ['var(--font-clash)', 'sans-serif'],
        body: ['var(--font-satoshi)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-dark': 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glow: {
          from: { boxShadow: '0 0 5px #28abfd40, 0 0 10px #28abfd20' },
          to:   { boxShadow: '0 0 20px #28abfd60, 0 0 40px #28abfd30' },
        },
      },
    },
  },
  plugins: [],
};
