import { ReactNode } from "react";

export interface Role {
  icon: string;
  tag: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  borderGlow: string;
  title: string;
  features: string[];
  cta: string;
}

export interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export interface Step {
  num: string;
  title: string;
  desc: string;
}

export interface IntersectionResult {
  ref: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}

export interface LabelProps {
  children: ReactNode;
  center?: boolean;
}

export interface NavProps {
  onMenuOpen: () => void;
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export interface RoleCardProps {
  role: Role;
  index: number;
}

export interface FeatureCardProps {
  feature: Feature;
  index: number;
}

export interface StepCardProps {
  step: Step;
  index: number;
}
