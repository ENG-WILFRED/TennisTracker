/**
 * Vico Ranking Engine
 * 
 * Scalable, explainable, fast ranking system
 * 
 * Architecture:
 * - Event-driven: All events flow through a central system
 * - Multi-dimensional: Competitive, Development, Activity scores
 * - Formula versioned: Support formula updates and replays
 * - Cached: Aggressive Redis caching for speed
 * - Anti-abuse: Diminishing returns, verification requirements
 * - Explainable: User-friendly explanations for every change
 * - Async: Background workers for calculations
 * - Replayable: Rebuild rankings with new formulas
 * 
 * Flow: events → handlers → calculators → snapshots → projections → cache
 * 
 * Key Principles:
 * - Events are source-of-truth, not snapshots
 * - Multiple layers of verification for competitive ranking
 * - Clear separation of concerns (modular monolith)
 * - Performance optimized with strategic caching
 * - Complete audit trail of all calculations
 */

// Formula versioning and management
export * from './formulas/formula-versioning';

// Confidence and provisional rankings
export * from './confidence/ranking-confidence';

// Anti-abuse protection
export * from './anti-abuse/anti-abuse-system';

// Human-readable explanations
export * from './explanations/explanation-engine';

// Calculators for each dimension
export * from './calculators/competitive-rank.calculator';
export * from './calculators/development-score.calculator';
export * from './calculators/activity-score.calculator';

// Replayable calculation engine
export * from './replay/replay-engine';

// Caching strategy
export * from './cache/cache-strategy';

// Async workers and jobs
export * from './workers/ranking-workers';

// Event handlers and types
export * from './types';
export * from './calculators';
export * from './handlers';
export * from './projections';
