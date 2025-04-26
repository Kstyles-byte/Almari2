/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './**/*.{js,ts,jsx,tsx,mdx}',  // This will catch files at any level
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        heading: ['Playfair Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Custom Zervia color palette
        zervia: {
          50: '#F2F1F9',
          100: '#E5DEFF',
          200: '#D8C9FF',
          300: '#BEA5FF',
          400: '#9B87F5',
          500: '#7E69AB', // Primary purple
          600: '#6E59A5', // Tertiary purple
          700: '#4E3D8B',
          800: '#372A62',
          900: '#1A1F2C', // Dark purple
        },
        accent: {
          green: '#F2FCE2',   // Soft Green
          yellow: '#FEF7CD',  // Soft Yellow
          orange: '#FEC6A1',  // Soft Orange
          peach: '#FDE1D3',   // Soft Peach
          pink: '#FFDEE2',    // Soft Pink
          blue: '#D3E4FD',    // Soft Blue
          DEFAULT: '#E5DEFF', // Soft Purple
        },
        primary: {
          DEFAULT: '#7E69AB', // Primary purple
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#1A1F2C', // Dark purple
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#F2F1F9', // Light background
          foreground: '#6E59A5' // Tertiary purple
        },
        destructive: {
          DEFAULT: '#ea384c', // Red
          foreground: '#FFFFFF'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          to: { height: '0', opacity: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' }
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        'preloader': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        },
        'preloader-fade': {
          '0%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'scale-out': 'scale-out 0.3s ease-out',
        'slide-in': 'slide-in 0.4s ease-out',
        'slide-out': 'slide-out 0.4s ease-out',
        'spin-slow': 'spin-slow 8s linear infinite',
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'preloader': 'preloader 1.5s infinite ease-in-out, preloader-fade 2s forwards ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} 