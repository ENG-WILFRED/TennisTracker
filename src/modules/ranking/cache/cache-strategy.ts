/**
 * Caching Strategy Implementation
 * 
 * CRITICAL for performance.
 * Leaderboards become expensive quickly.
 * Use Redis aggressively with smart invalidation.
 */

/**
 * Cache keys for ranking data
 */
export const RankingCacheKeys = {
  // Leaderboards
  leaderboardGlobal: (orgId: string) => `ranking:leaderboard:global:${orgId}`,
  leaderboardDevelopment: (orgId: string) => `ranking:leaderboard:development:${orgId}`,
  leaderboardActivity: (orgId: string) => `ranking:leaderboard:activity:${orgId}`,
  
  // Player rankings
  playerRankingSummary: (playerId: string, orgId: string) => 
    `ranking:player:summary:${playerId}:${orgId}`,
  playerCompetitiveRank: (playerId: string, orgId: string) => 
    `ranking:player:competitive:${playerId}:${orgId}`,
  playerDevelopmentScore: (playerId: string, orgId: string) => 
    `ranking:player:development:${playerId}:${orgId}`,
  playerActivityScore: (playerId: string, orgId: string) => 
    `ranking:player:activity:${playerId}:${orgId}`,
  playerOverallIndex: (playerId: string, orgId: string) => 
    `ranking:player:overall:${playerId}:${orgId}`,
  
  // Explanations
  rankingExplanation: (playerId: string, dimension: string, orgId: string) =>
    `ranking:explanation:${dimension}:${playerId}:${orgId}`,
  
  // Confidence
  playerConfidence: (playerId: string, dimension: string, orgId: string) =>
    `ranking:confidence:${dimension}:${playerId}:${orgId}`,
  
  // Anti-abuse
  abuseAssessment: (playerId: string, orgId: string) =>
    `ranking:abuse:assessment:${playerId}:${orgId}`,
};

/**
 * Cache TTL (Time-To-Live) in seconds
 */
export const CacheTTL = {
  // Fast-moving data
  playerRankingSummary: 60,        // 1 minute
  rankingExplanation: 300,         // 5 minutes
  playerConfidence: 300,           // 5 minutes
  
  // Medium-moving data
  leaderboards: 300,               // 5 minutes
  playerDimensions: 300,           // 5 minutes
  
  // Slower data
  abuseAssessment: 3600,           // 1 hour
  
  // Very stable
  formulaVersion: 86400,           // 24 hours
};

/**
 * Cache invalidation strategy
 */
export interface CacheInvalidationStrategy {
  // What triggers invalidation
  onMatchCompleted: string[];       // Cache keys to invalidate
  onSessionAttended: string[];
  onCoachFeedback: string[];
  onBookingCompleted: string[];
  onInactivityDetected: string[];
}

/**
 * Default invalidation strategy
 */
export const DefaultInvalidationStrategy: CacheInvalidationStrategy = {
  onMatchCompleted: [
    'ranking:leaderboard:*',        // All leaderboards
    'ranking:player:*',             // All player data
    'ranking:explanation:*',        // All explanations
  ],
  
  onSessionAttended: [
    'ranking:leaderboard:development:*',
    'ranking:player:development:*',
    'ranking:player:overall:*',
    'ranking:explanation:DEVELOPMENT:*',
  ],
  
  onCoachFeedback: [
    'ranking:leaderboard:development:*',
    'ranking:player:development:*',
    'ranking:player:overall:*',
  ],
  
  onBookingCompleted: [
    'ranking:leaderboard:activity:*',
    'ranking:player:activity:*',
    'ranking:player:overall:*',
  ],
  
  onInactivityDetected: [
    'ranking:leaderboard:*',
    'ranking:player:*',
  ],
};

/**
 * Cache manager interface
 */
export interface CacheManager {
  // Get
  get<T>(key: string): Promise<T | null>;
  
  // Set
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  // Delete
  delete(key: string): Promise<void>;
  
  // Invalidate by pattern
  invalidatePattern(pattern: string): Promise<number>; // Returns count deleted
  
  // Batch operations
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(entries: Array<[string, T]>, ttl?: number): Promise<void>;
  
  // Get stats
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  hitRate: number;              // 0-1
  missRate: number;             // 0-1
  totalKeys: number;
  approximateMemoryUsageMB: number;
}

/**
 * Smart cache invalidation
 * Only invalidate what's necessary
 */
export class SmartCacheInvalidator {
  constructor(private cache: CacheManager) {}
  
  /**
   * Invalidate cache after match completion
   */
  async invalidateAfterMatch(
    playerId: string,
    opponentId: string,
    organizationId: string
  ): Promise<void> {
    const keysToInvalidate = [
      // Player's data
      RankingCacheKeys.playerRankingSummary(playerId, organizationId),
      RankingCacheKeys.playerCompetitiveRank(playerId, organizationId),
      RankingCacheKeys.playerOverallIndex(playerId, organizationId),
      
      // Opponent's data (they were also ranked)
      RankingCacheKeys.playerRankingSummary(opponentId, organizationId),
      RankingCacheKeys.playerCompetitiveRank(opponentId, organizationId),
      
      // Leaderboards affected
      RankingCacheKeys.leaderboardGlobal(organizationId),
    ];
    
    for (const key of keysToInvalidate) {
      await this.cache.delete(key);
    }
  }
  
  /**
   * Invalidate after session attendance
   */
  async invalidateAfterSession(
    playerId: string,
    organizationId: string
  ): Promise<void> {
    const keysToInvalidate = [
      RankingCacheKeys.playerDevelopmentScore(playerId, organizationId),
      RankingCacheKeys.playerOverallIndex(playerId, organizationId),
      RankingCacheKeys.playerRankingSummary(playerId, organizationId),
      RankingCacheKeys.leaderboardDevelopment(organizationId),
    ];
    
    for (const key of keysToInvalidate) {
      await this.cache.delete(key);
    }
  }
  
  /**
   * Invalidate after coach feedback
   */
  async invalidateAfterFeedback(
    playerId: string,
    organizationId: string
  ): Promise<void> {
    await this.invalidateAfterSession(playerId, organizationId);
  }
  
  /**
   * Invalidate after booking
   */
  async invalidateAfterBooking(
    playerId: string,
    organizationId: string
  ): Promise<void> {
    const keysToInvalidate = [
      RankingCacheKeys.playerActivityScore(playerId, organizationId),
      RankingCacheKeys.playerOverallIndex(playerId, organizationId),
      RankingCacheKeys.playerRankingSummary(playerId, organizationId),
      RankingCacheKeys.leaderboardActivity(organizationId),
    ];
    
    for (const key of keysToInvalidate) {
      await this.cache.delete(key);
    }
  }
  
  /**
   * Bulk invalidate all leaderboards for refresh
   */
  async invalidateAllLeaderboards(organizationId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(RankingCacheKeys.leaderboardGlobal(organizationId)),
      this.cache.delete(RankingCacheKeys.leaderboardDevelopment(organizationId)),
      this.cache.delete(RankingCacheKeys.leaderboardActivity(organizationId)),
    ]);
  }
}

/**
 * Mock Redis-compatible cache implementation for development
 */
export class MemoryCacheManager implements CacheManager {
  private store: Map<string, { value: any; expiresAt: number }> = new Map();
  private stats = { hits: 0, misses: 0 };
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (item.expiresAt < Date.now()) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value as T;
  }
  
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }
  
  async mset<T>(entries: Array<[string, T]>, ttl: number = 300): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }
  
  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    return {
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
      totalKeys: this.store.size,
      approximateMemoryUsageMB: 0, // Simplified
    };
  }
}
