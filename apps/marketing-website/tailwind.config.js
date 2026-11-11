/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1565FF',
          'blue-dark': '#0D47CC',
          'blue-light': '#E8EEFF',
          green: '#22C55E',
          'green-dark': '#16A34A',
          'green-light': '#DCFCE7',
          purple: '#A855F7',
          'purple-dark': '#9333EA',
          'purple-light': '#F3E8FF',
        },
        bg: {
          light: '#F8FAFC',
          white: '#FFFFFF',
          muted: '#F1F5F9',
        },
        text: {
          dark: '#0F172A',
          muted: '#64748B',
          light: '#94A3B8',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        display: ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }],
        hero: ['3rem', { lineHeight: '1.15', fontWeight: '700' }],
        h1: ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
        h3: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        caption: ['0.875rem', { lineHeight: '1.5' }],
        xs: ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.1)',
        glass: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        glow: '0 0 30px rgba(21,101,255,0.2)',
        'glow-green': '0 0 30px rgba(34,197,94,0.2)',
        nav: '0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.35s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        section: '5rem',
        'section-lg': '7rem',
      },
      maxWidth: {
        container: '1280px',
        'container-sm': '1024px',
      },
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '250ms',
        slow: '400ms',
      },
      zIndex: {
        nav: '100',
        modal: '200',
        toast: '300',
        tooltip: '400',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
