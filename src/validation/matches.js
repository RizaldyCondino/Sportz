import { z } from 'zod';

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Schema for list matches query parameters
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Schema for match D parameterI
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});


// Schema for creating a new match
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'Sport is required'),
    homeTeam: z.string().min(1, 'Home team is required'),
    awayTeam: z.string().min(1, 'Away team is required'),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (data) => {
      try {
        new Date(data.startTime).toISOString();
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'startTime must be a valid ISO date string',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      try {
        new Date(data.endTime).toISOString();
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'endTime must be a valid ISO date string',
      path: ['endTime'],
    }
  )
  .superRefine((data, ctx) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be chronologically after startTime',
        path: ['endTime'],
      });
    }
  });

// Schema for updating match score
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
