import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, decimal } from "drizzle-orm/pg-core";
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
  preferredLeadershipStyle: text("preferred_leadership_style"),
  // Registration date used for billing cycle calculation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // The day of the month for billing cycle reset (e.g., if registered on the 15th, billingCycleDay = 15)
  billingCycleDay: integer("billing_cycle_day"),
  // Last payment date (for premium users)
  lastPaymentDate: timestamp("last_payment_date"),
  // Current subscription plan (free, premium, etc.)
  subscriptionPlan: text("subscription_plan").default("free"),
});

export const leaders = pgTable("leaders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  traits: jsonb("traits").$type<string[]>(),
  biography: text("biography").notNull(),
  photoUrl: text("photo_url"),
  controversial: boolean("controversial").default(false).notNull(),
  generationMostAffected: text("generation_most_affected"),
  leadershipStyles: jsonb("leadership_styles").$type<string[]>(),
  famousPhrases: jsonb("famous_phrases").$type<string[]>(),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  duration: integer("duration").notNull(),
  wordCount: integer("word_count").default(0),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  status: text("status").notNull().default("processing"),
  transcription: text("transcription"),
  analysisResult: jsonb("analysis_result").$type<AnalysisResult>(),
  errorDetails: text("error_details"), // Track any errors during processing
});

// Chapters, Modules, and Situations tables for the Training Module
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  leadershipTrait: text("leadership_trait"),
  situationType: text("situation_type"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const situations = pgTable("situations", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  description: text("description").notNull(),
  userPrompt: text("user_prompt").notNull(),
  styleResponses: jsonb("style_responses").$type<StyleResponses>(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  situationId: integer("situation_id").notNull(),
  response: text("response"),
  score: integer("score"),
  feedback: text("feedback"),
  passed: boolean("passed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const situationAttempts = pgTable("situation_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  situationId: integer("situation_id").notNull(),
  response: text("response").notNull(),
  leadershipStyle: text("leadership_style"),
  score: integer("score"),
  feedback: text("feedback"),
  evaluation: jsonb("evaluation").$type<AttemptEvaluation>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table to store leader-specific alternative responses for negative moments
export const leaderAlternatives = pgTable("leader_alternatives", {
  id: serial("id").primaryKey(),
  leaderId: integer("leader_id").notNull(),
  originalText: text("original_text").notNull(),
  alternativeText: text("alternative_text").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table to track billing-cycle word usage
export const userWordUsage = pgTable("user_word_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Legacy fields for backward compatibility
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  // Start of the billing cycle (anniversary date)
  cycleStartDate: timestamp("cycle_start_date").notNull(),
  // End of the billing cycle
  cycleEndDate: timestamp("cycle_end_date").notNull(),
  // Accumulated word count for this billing cycle
  wordCount: integer("word_count").notNull().default(0),
  // Billing cycle number (1 = first month, 2 = second month, etc.)
  cycleNumber: integer("cycle_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table to define subscription plan tiers with word limits and pricing
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planCode: text("plan_code").notNull().unique(),  // "starter", "pro", "executive"
  name: text("name").notNull(),                    // "Starter", "Pro", "Executive"
  monthlyWordLimit: integer("monthly_word_limit").notNull(), 
  monthlyPriceUsd: decimal("monthly_price_usd", { precision: 10, scale: 2 }).notNull(),
  yearlyPriceUsd: decimal("yearly_price_usd", { precision: 10, scale: 2 }).notNull(),
  features: jsonb("features").$type<string[]>(), 
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types for training module
export type StyleResponses = {
  empathetic: string;
  inspirational: string;
  commanding: string;
};

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

export type AttemptEvaluation = {
  styleMatchScore: number;
  clarity: number;
  empathy: number;
  persuasiveness: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
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

// Create Zod schemas for validation of new tables
export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export const insertSituationSchema = createInsertSchema(situations).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const updateUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  userId: true,
  situationId: true,
  createdAt: true,
});

export const insertSituationAttemptSchema = createInsertSchema(situationAttempts).omit({
  id: true,
  createdAt: true,
});

export const updateSituationAttemptSchema = createInsertSchema(situationAttempts).omit({
  id: true,
  userId: true,
  situationId: true,
  createdAt: true,
});

export const insertLeaderAlternativeSchema = createInsertSchema(leaderAlternatives).omit({
  id: true,
  createdAt: true,
});

export const insertUserWordUsageSchema = createInsertSchema(userWordUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserWordUsageSchema = createInsertSchema(userWordUsage).omit({
  id: true,
  userId: true,
  cycleStartDate: true,
  cycleEndDate: true,
  cycleNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  planCode: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type Leader = typeof leaders.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type InsertLeader = z.infer<typeof insertLeaderSchema>;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type UpdateRecording = z.infer<typeof updateRecordingSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Situation = typeof situations.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertSituation = z.infer<typeof insertSituationSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UpdateUserProgress = z.infer<typeof updateUserProgressSchema>;
export type SituationAttempt = typeof situationAttempts.$inferSelect;
export type InsertSituationAttempt = z.infer<typeof insertSituationAttemptSchema>;
export type UpdateSituationAttempt = z.infer<typeof updateSituationAttemptSchema>;
export type LeaderAlternative = typeof leaderAlternatives.$inferSelect;
export type InsertLeaderAlternative = z.infer<typeof insertLeaderAlternativeSchema>;
export type UserWordUsage = typeof userWordUsage.$inferSelect;
export type InsertUserWordUsage = z.infer<typeof insertUserWordUsageSchema>;
export type UpdateUserWordUsage = z.infer<typeof updateUserWordUsageSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UpdateSubscriptionPlan = z.infer<typeof updateSubscriptionPlanSchema>;
