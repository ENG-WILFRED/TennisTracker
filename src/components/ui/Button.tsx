import React from 'react';

const G = {
  primary: '#7dc142',
  primaryHover: '#a8d84e',
  cardBorder: '#2d5a35',
  text: '#d8e8b6',
  darkText: '#0a180a',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'link';
  href?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', href, style, children, ...props }) => {
  const base: React.CSSProperties = {
    borderRadius: 7,
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 700,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    textDecoration: 'none',
    transition: 'filter .12s, background .12s',
    border: 'none',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: G.primary, color: G.darkText },
    secondary: { background: 'transparent', color: G.text, border: `1px solid ${G.cardBorder}`, fontWeight: 600 },
    link: { background: 'transparent', color: G.text, border: 'none', padding: 0 },
  };

  const combined = { ...base, ...variants[variant], ...style } as React.CSSProperties;

  if (href) {
    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a href={href} style={combined} {...(props as any)}>
        {children}
      </a>
    );
  }

  return (
    <button style={combined} {...props}>
      {children}
    </button>
  );
};

export default Button;
