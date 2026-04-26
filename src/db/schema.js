import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  foreignKey,
} from 'drizzle-orm/pg-core';

// Define match_status enum
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

// Matches table
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Commentary table
export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  minute: integer('minute').notNull(),
  sequence: integer('sequence').notNull(),
  period: text('period').notNull(),
  eventType: text('event_type').notNull(),
  actor: text('actor').notNull(),
  team: text('team').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Export types for type-safe queries
export const types = {
  Match: typeof matches.$inferSelect,
  NewMatch: typeof matches.$inferInsert,
  Commentary: typeof commentary.$inferSelect,
  NewCommentary: typeof commentary.$inferInsert,
};

