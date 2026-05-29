/**
 * Formula Versioning System
 *
 * Manages ranking formulas with version control and replay support.
 * This keeps ranking events and snapshots tied to a formula version.
 */

import { RankingDimension, FormulaDefinition } from '../types';

export interface CompetitiveFormulaConfig {
  baseRating: number;
  kFactor: number;
  minMatchesForConfidence: number;
  maxSameOpponentBonus: number;
  tournamentWinMultiplier: number;
  inactivityDecayPercent: number;
  inactivityDecayStartDays: number;
  provisionalThreshold: number;
  stabilityThreshold: number;
}

export interface DevelopmentFormulaConfig {
  maxScore: number;
  pointsPerSession: number;
  minSessionDurationMinutes: number;
  consistencyStreakBonus: number;
  consecutiveSessionsRequired: number;
  feedbackWeight: number;
  improvementTrendWeight: number;
  inactivityDecayPercent: number;
  decayAfterDays: number;
}

export interface ActivityFormulaConfig {
  maxScore: number;
  pointsPerBooking: number;
  maxBookingsPerDay: number;
  pointsPerMatchPlayed: number;
  recentDaysWindow: number;
  pointsPerActiveDay: number;
  consecutiveDaysBonus: number;
  inactivityDecayPercent: number;
}

export interface OverallIndexFormulaConfig {
  competitiveWeight: number;
  developmentWeight: number;
  activityWeight: number;
  weightsSum: number;
}

export interface FormulaVersion extends FormulaDefinition {
  effectiveFrom: Date;
  effectiveUntil?: Date;
  createdBy: string;
  isDeprecated: boolean;
  competitiveFormula: CompetitiveFormulaConfig;
  developmentFormula: DevelopmentFormulaConfig;
  activityFormula: ActivityFormulaConfig;
  overallIndexFormula: OverallIndexFormulaConfig;
}

export class FormulaRegistry {
  private formulas: Map<string, FormulaVersion> = new Map();
  private activeVersion: FormulaVersion | null = null;

  register(formula: FormulaVersion): void {
    const weightsSum =
      formula.overallIndexFormula.competitiveWeight +
      formula.overallIndexFormula.developmentWeight +
      formula.overallIndexFormula.activityWeight;

    if (Math.abs(weightsSum - 1.0) > 0.01) {
      throw new Error(`Formula weights must sum to 1.0, got ${weightsSum}`);
    }

    this.formulas.set(formula.version, formula);

    if (formula.isActive) {
      this.activeVersion = formula;
    }
  }

  get(version: string): FormulaVersion | undefined {
    return this.formulas.get(version);
  }

  getActive(): FormulaVersion {
    if (!this.activeVersion) {
      throw new Error('No active formula version registered');
    }
    return this.activeVersion;
  }

  setActive(version: string): void {
    const formula = this.formulas.get(version);
    if (!formula) {
      throw new Error(`Formula version ${version} not found`);
    }
    if (!formula.isActive) {
      throw new Error(`Formula version ${version} is not active`);
    }
    this.activeVersion = formula;
  }

  getAllVersions(): FormulaVersion[] {
    return Array.from(this.formulas.values()).sort(
      (a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime()
    );
  }

  getAtTime(date: Date): FormulaVersion | undefined {
    return Array.from(this.formulas.values()).find(
      (f) => f.effectiveFrom <= date && (!f.effectiveUntil || f.effectiveUntil > date)
    );
  }
}

export class FormulaManager {
  private static instance: FormulaManager;
  private registry: FormulaRegistry;

  private constructor() {
    this.registry = new FormulaRegistry();
    this.initializeDefaultFormulas();
  }

  static getInstance(): FormulaManager {
    if (!FormulaManager.instance) {
      FormulaManager.instance = new FormulaManager();
    }
    return FormulaManager.instance;
  }

  private initializeDefaultFormulas(): void {
    this.registry.register(createV1Formula());
  }

  registerFormula(formula: FormulaVersion): void {
    this.registry.register(formula);
  }

  getFormula(version: string): FormulaVersion | undefined {
    return this.registry.get(version);
  }

  getActiveFormula(): FormulaVersion {
    return this.registry.getActive();
  }

  setActiveFormula(version: string): void {
    this.registry.setActive(version);
  }

  getVersionHistory(): FormulaVersion[] {
    return this.registry.getAllVersions();
  }

  getFormulaAt(date: Date): FormulaVersion | undefined {
    return this.registry.getAtTime(date);
  }
}

export const formulaManager = FormulaManager.getInstance();

export function createV1Formula(): FormulaVersion {
  return {
    version: 'v1',
    dimension: 'OVERALL_INDEX',
    name: 'Vico Ranking Formula v1',
    description: 'Baseline ranking formula for competitive, development, and activity dimensions',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    createdBy: 'system',
    isActive: true,
    isDeprecated: false,
    weights: {
      competitive: 0.5,
      development: 0.3,
      activity: 0.2,
    },
    parameters: {
      competitive: {
        kFactor: 32,
        baseRating: 1500,
        minMatchesForConfidence: 10,
        maxSameOpponentBonus: 5,
        tournamentWinMultiplier: 1.5,
        inactivityDecayPercent: 0.02,
        inactivityDecayStartDays: 28,
        provisionalThreshold: 10,
        stabilityThreshold: 5,
      },
      development: {
        maxScore: 100,
        pointsPerSession: 5,
        minSessionDurationMinutes: 15,
        consistencyStreakBonus: 3,
        consecutiveSessionsRequired: 4,
        feedbackWeight: 0.6,
        improvementTrendWeight: 0.4,
        inactivityDecayPercent: 0.03,
        decayAfterDays: 14,
      },
      activity: {
        maxScore: 100,
        pointsPerBooking: 2,
        maxBookingsPerDay: 3,
        pointsPerMatchPlayed: 3,
        recentDaysWindow: 30,
        pointsPerActiveDay: 1,
        consecutiveDaysBonus: 0.5,
        inactivityDecayPercent: 0.05,
      },
    },
    competitiveFormula: {
      baseRating: 1500,
      kFactor: 32,
      minMatchesForConfidence: 10,
      maxSameOpponentBonus: 5,
      tournamentWinMultiplier: 1.5,
      inactivityDecayPercent: 0.02,
      inactivityDecayStartDays: 28,
      provisionalThreshold: 10,
      stabilityThreshold: 5,
    },
    developmentFormula: {
      maxScore: 100,
      pointsPerSession: 5,
      minSessionDurationMinutes: 15,
      consistencyStreakBonus: 3,
      consecutiveSessionsRequired: 4,
      feedbackWeight: 0.6,
      improvementTrendWeight: 0.4,
      inactivityDecayPercent: 0.03,
      decayAfterDays: 14,
    },
    activityFormula: {
      maxScore: 100,
      pointsPerBooking: 2,
      maxBookingsPerDay: 3,
      pointsPerMatchPlayed: 3,
      recentDaysWindow: 30,
      pointsPerActiveDay: 1,
      consecutiveDaysBonus: 0.5,
      inactivityDecayPercent: 0.05,
    },
    minValue: 0,
    maxValue: 100,
    overallIndexFormula: {
      competitiveWeight: 0.5,
      developmentWeight: 0.3,
      activityWeight: 0.2,
      weightsSum: 1.0,
    },
  };
}
