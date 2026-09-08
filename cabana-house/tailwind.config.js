/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050505',
        ink2: '#0D0D0D',
        ink3: '#151515',
        paper: '#FFFFFF',
        mist: '#F5F5F5',
        gold: '#FFC800',
        gold2: '#D99F00',
        ember: '#FF6500',
        mag: '#D300C5',
      },
      fontFamily: {
        display: ['Oswald', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      maxWidth: {
        site: '1180px',
      },
      boxShadow: {
        gold: '0 14px 28px -20px rgba(217, 159, 0, 0.65)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'none' },
        },
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        ken: {
          from: { transform: 'scale(1.06)' },
          to: { transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 200, 0, 0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgba(255, 200, 0, 0)' },
        },
      },
      animation: {
        rise: 'rise 0.8s ease both',
        fade: 'fade 0.9s ease both',
        ken: 'ken 14s ease-out both',
        pulseSoft: 'pulseSoft 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
