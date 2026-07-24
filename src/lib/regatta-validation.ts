import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const personCreateSchema = z.object({
  startNumber: z.string().trim().max(20).optional().nullable(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  displayName: z.string().trim().min(1).max(100),
  email: z.union([z.string().trim().email(), z.literal('')]).optional().nullable(),
  password: z.string().min(6).max(200).optional().nullable(),
  isAdmin: z.boolean().optional().default(false),
});

export const personUpdateSchema = personCreateSchema.partial();

export const gpsPointSchema = z.object({
  sessionId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().nullable().optional(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  timestamp: z.number().positive(), // epoch ms, aus GeolocationPosition.timestamp
});

// ============================================================
// Bootsklassen
// ============================================================

export const boatClassSchema = z.object({
  name: z.string().trim().min(1).max(100),
  yardstick: z.number().positive().max(999),
});

export const boatClassUpdateSchema = boatClassSchema.partial();

// ============================================================
// Veranstaltungen
// ============================================================

const isoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Ungültiges Datum');

export const eventCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD erwartet'),
  startTime: isoDateString,
  status: z.enum(['planned', 'active', 'ended']).optional().default('planned'),
  gpsIntervalSeconds: z.number().int().min(1).max(60).optional().default(5),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// ============================================================
// Ziellinie
// ============================================================

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const finishLineSchema = z.object({
  pointA: latLngSchema,
  pointB: latLngSchema,
});

// ============================================================
// Crew-Registrierung
// ============================================================

const nationSchema = z.string().trim().min(2).max(56);
const birthYearSchema = z
  .number()
  .int()
  .min(1900)
  .max(new Date().getFullYear());
const sailNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^[A-Za-z0-9 \-]+$/, 'Nur Buchstaben, Zahlen, Leerzeichen und Bindestriche erlaubt');

export const crewMemberSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  nation: nationSchema,
  birthYear: birthYearSchema,
});

// Boot-Daten, gemeinsam genutzt von Neu-Registrierung und "weiteres Boot melden" (bestehender Account)
const boatEntrySchema = z.object({
  eventId: z.string().uuid(),
  boatClassId: z.string().uuid(),
  boatName: z.string().trim().min(1).max(100),
  sailNumber: sailNumberSchema,
  startNumber: z.string().trim().min(1).max(20),
  crew: z.array(crewMemberSchema).max(4).default([]),
});

// Vollständige Registrierung (öffentlich, unauthenticated): Skipper-Account + Boot + Crew
export const registerSchema = boatEntrySchema.extend({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  nation: nationSchema,
  birthYear: birthYearSchema,
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

// Zusätzliches Boot für einen bereits eingeloggten Skipper (kein neuer Account)
export const entryCreateSchema = boatEntrySchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
export type GpsPointInput = z.infer<typeof gpsPointSchema>;
export type BoatClassInput = z.infer<typeof boatClassSchema>;
export type BoatClassUpdateInput = z.infer<typeof boatClassUpdateSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type FinishLineInput = z.infer<typeof finishLineSchema>;
export type CrewMemberInput = z.infer<typeof crewMemberSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EntryCreateInput = z.infer<typeof entryCreateSchema>;
