const tailwindPreset = {
  theme: {
    extend: {
      fontFamily: {
        clash: ['Clash Display', 'sans-serif'],
        epilogue: ['Epilogue', 'sans-serif'],
      },
      colors: {
        vico: {
          primary: '#7dc142',
          primaryHover: '#a8d84e',
          background: '#0f1f0f',
          surface: '#1a3020',
          surfaceSecondary: '#152515',
          surfaceTertiary: '#2d5a27',
          border: '#2d5a35',
          textPrimary: '#e8f5e0',
          textMuted: '#7aaa6a',
          accent: '#a8d84e',
          success: '#7dc142',
          warning: '#f0c040',
          danger: '#dc2626',
          info: '#3d7a32',
          dark: '#0f1f0f',
          bright: '#3d7a32',
        },
      },
      boxShadow: {
        card: '0 18px 40px rgba(0, 0, 0, 0.16)',
        modal: '0 24px 80px rgba(0, 0, 0, 0.24)',
        dropdown: '0 14px 28px rgba(0, 0, 0, 0.18)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '9999px',
      },
      spacing: {
        4: '4px',
        8: '8px',
        12: '12px',
        16: '16px',
        24: '24px',
        32: '32px',
        40: '40px',
        48: '48px',
        64: '64px',
      },
    },
    colorSpace: 'srgb',
  },
};

export default tailwindPreset;
export { tailwindPreset };
