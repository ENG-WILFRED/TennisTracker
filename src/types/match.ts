export interface Match {
  id: string;
  round: string;
  playerAId: string;
  playerBId: string;
  refereeId: string;
  ballCrewIds: string[];
  winnerId?: string;
  score: Record<string, number>;
}