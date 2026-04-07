import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRefereeMatches() {
  console.log('🎾 Seeding referee match data...');

  // Get some referees from the database
  const referees = await prisma.referee.findMany({ take: 3 });
  
  if (referees.length === 0) {
    console.log('No referees found. Run referee seed first.');
    return;
  }

  // Get some players to create matches with
  const players = await prisma.player.findMany({ take: 10 });
  
  if (players.length < 2) {
    console.log('Not enough players. Run player seed first.');
    return;
  }

  // Sample match data
  const matchDataTemplate = [
    {
      title: 'Federer vs Alcaraz',
      description: 'Final Match',
      date: new Date('2026-03-20T15:00:00'),
      status: 'completed',
      player1: 'Roger Federer',
      player2: 'Carlos Alcaraz',
      result: '6-4, 7-5',
      score: { set1: '6-4', set2: '7-5', set3: null },
    },
    {
      title: 'Medvedev vs Djokovic',
      description: 'Semi-Final',
      date: new Date('2026-03-19T14:30:00'),
      status: 'completed',
      player1: 'Daniil Medvedev',
      player2: 'Novak Djokovic',
      result: '4-6, 6-3, 7-6',
      score: { set1: '4-6', set2: '6-3', set3: '7-6' },
    },
    {
      title: 'Omondi vs Hassan',
      description: 'Quarter-Final',
      date: new Date('2026-03-18T16:00:00'),
      status: 'completed',
      player1: 'Adrian Omondi',
      player2: 'Hassan Mohamed',
      result: '6-2, 6-4',
      score: { set1: '6-2', set2: '6-4', set3: null },
    },
    {
      title: 'Kimani vs Wanjiru',
      description: 'Round of 16',
      date: new Date('2026-03-17T13:00:00'),
      status: 'completed',
      player1: 'Simon Kimani',
      player2: 'Samuel Wanjiru',
      result: '6-3, 6-2',
      score: { set1: '6-3', set2: '6-2', set3: null },
    },
    {
      title: 'Mutua vs Kamau',
      description: 'First Round',
      date: new Date('2026-03-16T10:00:00'),
      status: 'completed',
      player1: 'Thomas Mutua',
      player2: 'David Kamau',
      result: '4-6, 6-3, 7-5',
      score: { set1: '4-6', set2: '6-3', set3: '7-5' },
    },
    {
      title: 'Kipchoge vs Mwangi',
      description: 'Doubles Final',
      date: new Date('2026-04-01T15:30:00'),
      status: 'completed',
      player1: 'Lucy Kipchoge + Jane Mwangi',
      player2: 'Sarah Kipchoge + Anne Kariuki',
      result: '6-4, 6-3',
      score: { set1: '6-4', set2: '6-3', set3: null },
    },
    {
      title: 'Mixed Doubles Semi-Final',
      description: 'Championship',
      date: new Date('2026-04-02T14:00:00'),
      status: 'completed',
      player1: 'James Omondi + Sarah Kipchoge',
      player2: 'Michael Kimani + Elizabeth Mutua',
      result: '7-6, 6-4',
      score: { set1: '7-6', set2: '6-4', set3: null },
    },
    {
      title: 'Junior Championship',
      description: 'U18 Singles',
      date: new Date('2026-03-21T11:00:00'),
      status: 'completed',
      player1: 'Young Player A',
      player2: 'Young Player B',
      result: '6-1, 6-2',
      score: { set1: '6-1', set2: '6-2', set3: null },
    },
  ];

  for (let i = 0; i < matchDataTemplate.length; i++) {
    try {
      const matchData = matchDataTemplate[i];
      const referee = referees[i % referees.length];

      // Create match
      const match = await prisma.match.create({
        data: {
          title: matchData.title,
          description: matchData.description,
          matchDateTime: matchData.date,
          status: matchData.status,
          refereeId: referee.userId,
          courtName: `Court ${(i % 5) + 1}`,
          categoryName: i % 2 === 0 ? 'Singles' : 'Doubles',
          matchFormat: '2 Sets - No Tiebreak' + (i % 3 === 0 ? ' - 3rd set Tiebreak' : ''),
          notes: matchData.score,
        },
      });

      console.log(`✓ Created match: ${matchData.title} (Referee: ${referee.userId})`);
    } catch (error) {
      console.error(`✗ Error creating match:`, error);
    }
  }

  console.log('✓ Referee match seeding complete');
}

export default seedRefereeMatches;
