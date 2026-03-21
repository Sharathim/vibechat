import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          light: 'var(--brand-light)',
          subtle: 'var(--brand-subtle)',
          border: 'var(--brand-border)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          subtle: 'var(--accent-subtle)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
        },
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'var(--success-subtle)',
        },
        error: {
          DEFAULT: 'var(--error)',
          subtle: 'var(--error-subtle)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          subtle: 'var(--warning-subtle)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        brand: 'var(--shadow-brand)',
      },
    },
  },
  plugins: [],
}

export default config
