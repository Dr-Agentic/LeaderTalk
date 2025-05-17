import { db } from './db';
import { 
  users, User, InsertUser, UpdateUser,
  leaders, Leader, InsertLeader,
  recordings, Recording, InsertRecording, UpdateRecording,
  leaderAlternatives, LeaderAlternative, InsertLeaderAlternative,
  userWordUsage, UserWordUsage, InsertUserWordUsage, UpdateUserWordUsage,
  subscriptionPlans, SubscriptionPlan, InsertSubscriptionPlan, UpdateSubscriptionPlan,
  AnalysisResult
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { IStorage } from './storage';

// Helper functions for billing cycle management
function calculateCycleStartDate(registrationDate: Date, currentDate: Date, billingCycleDay?: number): Date {
  const now = new Date(currentDate);
  const nowDay = now.getUTCDate();
  const nowMonth = now.getUTCMonth();
  const nowYear = now.getUTCFullYear();
  
  // Use the registration date or a specified billing cycle day
  let cycleDay: number;
  
  if (billingCycleDay) {
    // The user has a specific billing cycle day
    cycleDay = Math.min(billingCycleDay, getDaysInMonth(nowYear, nowMonth + 1));
  } else {
    // Use the day from the registration date
    cycleDay = registrationDate.getUTCDate();
  }
  
  // If today is before the cycle day, we're in the current month's cycle
  if (nowDay < cycleDay) {
    return new Date(Date.UTC(nowYear, nowMonth, cycleDay, 0, 0, 0, 0));
  }
  
  // Otherwise, we're in this month's cycle that started on the cycle day
  return new Date(Date.UTC(nowYear, nowMonth, cycleDay, 0, 0, 0, 0));
}

function calculateCycleEndDate(startDate: Date): Date {
  const cycleEnd = new Date(startDate);
  // Add one month
  cycleEnd.setUTCMonth(cycleEnd.getUTCMonth() + 1);
  // Subtract 1 millisecond to end at 23:59:59.999 of the previous day
  cycleEnd.setUTCMilliseconds(-1);
  return cycleEnd;
}

function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed (1 = January, 12 = December)
  return new Date(year, month, 0).getDate();
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Leader operations
  async getLeaders(): Promise<Leader[]> {
    return db.select().from(leaders);
  }

  async getLeader(id: number): Promise<Leader | undefined> {
    const result = await db.select().from(leaders).where(eq(leaders.id, id));
    return result[0];
  }

  async createLeader(leader: InsertLeader): Promise<Leader> {
    const result = await db.insert(leaders).values(leader).returning();
    return result[0];
  }

  // Recording operations
  async getRecordings(userId: number): Promise<Recording[]> {
    return db.select()
      .from(recordings)
      .where(eq(recordings.userId, userId))
      .orderBy(desc(recordings.recordedAt));
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    const result = await db.select().from(recordings).where(eq(recordings.id, id));
    return result[0];
  }

  async createRecording(recording: InsertRecording): Promise<Recording> {
    const result = await db.insert(recordings).values(recording).returning();
    return result[0];
  }

  async updateRecording(id: number, data: UpdateRecording): Promise<Recording | undefined> {
    const result = await db
      .update(recordings)
      .set(data)
      .where(eq(recordings.id, id))
      .returning();
    
    return result[0];
  }

  async updateRecordingAnalysis(
    id: number, 
    transcription: string, 
    analysisResult: AnalysisResult
  ): Promise<Recording | undefined> {
    const result = await db
      .update(recordings)
      .set({
        transcription,
        analysisResult,
        status: "completed"
      })
      .where(eq(recordings.id, id))
      .returning();
    
    return result[0];
  }

  // Leader alternatives operations
  async getLeaderAlternative(leaderId: number, originalText: string): Promise<LeaderAlternative | undefined> {
    const result = await db.select()
      .from(leaderAlternatives)
      .where(
        and(
          eq(leaderAlternatives.leaderId, leaderId),
          eq(leaderAlternatives.originalText, originalText)
        )
      );
    return result[0];
  }

  async createLeaderAlternative(alternative: InsertLeaderAlternative): Promise<LeaderAlternative> {
    const result = await db.insert(leaderAlternatives)
      .values(alternative)
      .returning();
    return result[0];
  }

  async getLeaderAlternatives(leaderId: number): Promise<LeaderAlternative[]> {
    return db.select()
      .from(leaderAlternatives)
      .where(eq(leaderAlternatives.leaderId, leaderId));
  }
  
  // Word usage tracking operations
  async getUserWordUsage(userId: number): Promise<UserWordUsage[]> {
    return db.select()
      .from(userWordUsage)
      .where(eq(userWordUsage.userId, userId))
      .orderBy(desc(userWordUsage.cycleNumber));
  }
  
  async getCurrentBillingCycle(userId: number): Promise<UserWordUsage | undefined> {
    const now = new Date();
    
    const result = await db.select()
      .from(userWordUsage)
      .where(
        and(
          eq(userWordUsage.userId, userId),
          sql`${userWordUsage.cycleStartDate} <= ${now}`,
          sql`${userWordUsage.cycleEndDate} >= ${now}`
        )
      );
    
    return result[0];
  }
  
  async createUserWordUsage(usage: InsertUserWordUsage): Promise<UserWordUsage> {
    const result = await db.insert(userWordUsage)
      .values(usage)
      .returning();
    return result[0];
  }
  
  async updateUserWordUsage(id: number, data: UpdateUserWordUsage): Promise<UserWordUsage | undefined> {
    const result = await db.update(userWordUsage)
      .set(data)
      .where(eq(userWordUsage.id, id))
      .returning();
    return result[0];
  }
  
  async getCurrentWordUsage(userId: number): Promise<number> {
    // Get all word usage entries for this user
    const allEntries = await db.select()
      .from(userWordUsage)
      .where(eq(userWordUsage.userId, userId))
      .orderBy(desc(userWordUsage.id));
    
    // If we have entries, return the word count from the most recent one
    if (allEntries.length > 0) {
      // Return the word count from the most recent entry
      return allEntries[0].wordCount;
    }
    
    return 0;
  }
  
  async getOrCreateCurrentBillingCycle(userId: number): Promise<UserWordUsage> {
    // First, try to get the current cycle
    const currentCycle = await this.getCurrentBillingCycle(userId);
    if (currentCycle) {
      return currentCycle;
    }
    
    // If no current cycle exists, we need to create one
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Get user creation date to use as reference for billing cycles
    const userCreatedAt = user.createdAt;
    const now = new Date();
    
    // Find the most recent cycle to determine the next cycle number
    const previousCycles = await db.select()
      .from(userWordUsage)
      .where(eq(userWordUsage.userId, userId))
      .orderBy(desc(userWordUsage.cycleNumber))
      .limit(1);
    
    const lastCycleNumber = previousCycles.length > 0 ? previousCycles[0].cycleNumber : 0;
    const newCycleNumber = lastCycleNumber + 1;
    
    // Calculate the billing cycle dates
    const cycleStartDate = calculateCycleStartDate(userCreatedAt, now, user.billingCycleDay);
    const cycleEndDate = calculateCycleEndDate(cycleStartDate);
    
    // Create the new billing cycle record
    const newCycle = await this.createUserWordUsage({
      userId,
      year: cycleStartDate.getUTCFullYear(),
      month: cycleStartDate.getUTCMonth() + 1, // JavaScript months are 0-indexed
      cycleStartDate,
      cycleEndDate,
      wordCount: 0,
      cycleNumber: newCycleNumber
    });
    
    return newCycle;
  }
  // Initialize default leaders if none exist
  async initializeDefaultLeaders(): Promise<void> {
    const existingLeaders = await this.getLeaders();
    
    if (existingLeaders.length === 0) {
      const defaultLeaders = [
        {
          name: "Nelson Mandela",
          title: "Former President of South Africa",
          description: "Inclusive and reconciliatory leadership style",
          biography: "Nelson Rolihlahla Mandela was a South African anti-apartheid revolutionary who served as President of South Africa from 1994 to 1999. He was known for his powerful speeches and reconciliation approach.",
          traits: ["Empathetic", "Inclusive", "Reconciliatory", "Resilient"],
          photoUrl: "/leaders/mandela.jpg"
        },
        {
          name: "Barack Obama",
          title: "Former President of the United States",
          description: "Eloquent and inspiring communication style",
          biography: "Barack Hussein Obama II is an American politician who served as the 44th president of the United States from 2009 to 2017. He is known for his powerful oratory skills.",
          traits: ["Eloquent", "Thoughtful", "Measured", "Hopeful"],
          photoUrl: "/leaders/obama.jpg"
        },
        {
          name: "Oprah Winfrey",
          title: "Media Executive and Philanthropist",
          description: "Empathetic and emotionally intelligent communicator",
          biography: "Oprah Gail Winfrey is an American talk show host, television producer, actress, author, and philanthropist. She is best known for her talk show, The Oprah Winfrey Show.",
          traits: ["Empathetic", "Emotional Intelligence", "Storytelling", "Authenticity"],
          photoUrl: "/leaders/oprah.jpg"
        },
        {
          name: "Winston Churchill",
          title: "Former Prime Minister of the United Kingdom",
          description: "Bold and decisive rhetorical style",
          biography: "Sir Winston Leonard Spencer Churchill was a British statesman, soldier, and writer who served as Prime Minister of the United Kingdom twice, from 1940 to 1945 during the Second World War, and again from 1951 to 1955.",
          traits: ["Bold", "Decisive", "Rhetorical", "Inspirational"],
          photoUrl: "/leaders/churchill.jpg"
        },
        {
          name: "Malala Yousafzai",
          title: "Nobel Peace Prize Laureate and Activist",
          description: "Authentic and passionate communication",
          biography: "Malala Yousafzai is a Pakistani activist for female education and the youngest Nobel Prize laureate. She is known for human rights advocacy, especially the education of women and children.",
          traits: ["Authentic", "Direct", "Passionate", "Brave"],
          photoUrl: "/leaders/malala.jpg"
        }
      ];
      
      for (const leader of defaultLeaders) {
        await this.createLeader(leader);
      }
    }
  }
}

// Export a singleton instance
export const dbStorage = new DatabaseStorage();