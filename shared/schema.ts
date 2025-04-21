import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").notNull().unique(),
  photoUrl: text("photo_url"),
  dateOfBirth: text("date_of_birth"),
  profession: text("profession"),
  goals: text("goals"),
  selectedLeaders: jsonb("selected_leaders").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaders = pgTable("leaders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  traits: jsonb("traits").$type<string[]>(),
  biography: text("biography").notNull(),
  photoUrl: text("photo_url"),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  duration: integer("duration").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  status: text("status").notNull().default("processing"),
  transcription: text("transcription"),
  analysisResult: jsonb("analysis_result").$type<AnalysisResult>(),
});

export type AnalysisResult = {
  overview: {
    rating: string;
    score: number;
    summary: string;
  };
  timeline: TimelinePoint[];
  positiveInstances: AnalysisInstance[];
  negativeInstances: AnalysisInstance[];
  passiveInstances: AnalysisInstance[];
  leadershipInsights: LeadershipInsight[];
};

export type TimelinePoint = {
  timestamp: number;
  value: number;
  type: "positive" | "neutral" | "negative" | "passive";
};

export type AnalysisInstance = {
  timestamp: number;
  text: string;
  analysis: string;
  improvement?: string;
};

export type LeadershipInsight = {
  leaderId: number;
  leaderName: string;
  advice: string;
};

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  googleId: true,
  email: true,
  username: true,
  createdAt: true,
});

export const insertLeaderSchema = createInsertSchema(leaders).omit({
  id: true,
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  recordedAt: true,
  status: true,
  transcription: true,
  analysisResult: true,
});

export const updateRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  userId: true,
  recordedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type Leader = typeof leaders.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type InsertLeader = z.infer<typeof insertLeaderSchema>;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type UpdateRecording = z.infer<typeof updateRecordingSchema>;
