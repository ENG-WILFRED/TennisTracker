import { MembershipCardData } from '@/utils/generateMembershipCardPDF';

export interface CardTemplate {
  id: string;
  name: string;
  organizationId?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  logo?: string;
  backgroundPattern?: string;
  fontFamily?: string;
}

export const DEFAULT_CARD_TEMPLATE: CardTemplate = {
  id: 'default',
  name: 'Vico Tennis Default',
  colors: {
    primary: '#0e7490',    // Sky blue
    secondary: '#64748b',  // Slate gray
    accent: '#0f172a',     // Dark slate
    background: '#ffffff'  // White
  },
  logo: '/vico_logo.png',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

export const CARD_TEMPLATES: Record<string, CardTemplate> = {
  default: DEFAULT_CARD_TEMPLATE,
  premium: {
    id: 'premium',
    name: 'Premium Club',
    colors: {
      primary: '#7c3aed',    // Purple
      secondary: '#64748b',
      accent: '#1e1b4b',     // Dark purple
      background: '#fefefe'
    },
    logo: '/premium_logo.png',
    backgroundPattern: 'linear-gradient(135deg, #fefefe 0%, #f8fafc 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  elite: {
    id: 'elite',
    name: 'Elite Tennis',
    colors: {
      primary: '#dc2626',    // Red
      secondary: '#64748b',
      accent: '#7f1d1d',     // Dark red
      background: '#ffffff'
    },
    logo: '/elite_logo.png',
    backgroundPattern: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
};

export function getCardTemplate(organizationId?: string, templateId?: string): CardTemplate {
  // If specific template requested, return it
  if (templateId && CARD_TEMPLATES[templateId]) {
    return CARD_TEMPLATES[templateId];
  }

  // TODO: Add organization-specific template logic
  // For now, return default
  return DEFAULT_CARD_TEMPLATE;
}

export function applyTemplateToCardData(
  data: MembershipCardData,
  template: CardTemplate
): MembershipCardData & { template: CardTemplate } {
  return {
    ...data,
    template
  };
}