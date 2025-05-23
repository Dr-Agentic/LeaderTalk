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
  
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return result;
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
    try {
      // First, get the user to determine their Stripe subscription billing cycle
      const user = await this.getUser(userId);
      if (!user) {
        console.log(`User ${userId} not found`);
        return 0;
      }

      let billingCycleStart: Date;
      let billingCycleEnd: Date;

      // Get billing cycle dates from Stripe using centralized service
      if (user.stripeCustomerId && user.stripeSubscriptionId) {
        try {
          // Use centralized subscription service
          const { auditUserSubscriptions, getUserBillingCycle } = await import('./subscriptionService');
          
          // Audit for multiple subscriptions
          await auditUserSubscriptions(userId);
          
          // Get billing cycle dates
          const billingCycle = await getUserBillingCycle(userId);
          billingCycleStart = billingCycle.start;
          billingCycleEnd = billingCycle.end;
          
          console.log(`📅 Final billing cycle for user ${userId}: ${billingCycleStart.toISOString()} to ${billingCycleEnd.toISOString()}`);
        } catch (stripeError) {
          console.error(`Error fetching Stripe billing cycle for user ${userId}:`, stripeError);
          throw new Error(`Failed to get billing cycle from Stripe: ${stripeError.message}`);
        }
      } else {
        // Fall back to registration-based billing cycle
        billingCycleStart = this.calculateUserBillingCycleStart(user);
        billingCycleEnd = this.calculateUserBillingCycleEnd(billingCycleStart);
        console.log(`📅 Using registration-based billing cycle for user ${userId}: ${billingCycleStart.toISOString()} to ${billingCycleEnd.toISOString()}`);
      }

      // Get word usage entries that fall within the current billing cycle
      // Filter by when recordings were actually made (createdAt) vs Stripe billing cycle
      const currentCycleEntries = await db.select()
        .from(userWordUsage)
        .where(
          and(
            eq(userWordUsage.userId, userId),
            sql`${userWordUsage.createdAt} >= ${billingCycleStart}`,
            sql`${userWordUsage.createdAt} < ${billingCycleEnd}`
          )
        );
      
      console.log(`📊 Found ${currentCycleEntries.length} word usage entries for user ${userId} in current billing cycle`);
      
      // Debug: Show the first few database entries to see their date format
      if (currentCycleEntries.length > 0) {
        console.log(`🔍 Sample database entries (first 3):`);
        currentCycleEntries.slice(0, 3).forEach((entry, index) => {
          console.log(`   Entry ${index + 1}: cycleStartDate=${entry.cycleStartDate}, wordCount=${entry.wordCount}, createdAt=${entry.createdAt}`);
        });
      }
      
      // Also get ALL entries for this user to see the full picture
      const allUserEntries = await db.select()
        .from(userWordUsage)
        .where(eq(userWordUsage.userId, userId));
      
      console.log(`🔍 Total entries for user ${userId}: ${allUserEntries.length}`);
      if (allUserEntries.length > 0) {
        console.log(`🔍 Sample ALL entries (first 3):`);
        allUserEntries.slice(0, 3).forEach((entry, index) => {
          console.log(`   All Entry ${index + 1}: cycleStartDate=${entry.cycleStartDate}, wordCount=${entry.wordCount}, createdAt=${entry.createdAt}`);
        });
      }
      
      if (currentCycleEntries.length > 0) {
        const totalWords = currentCycleEntries.reduce((sum, entry) => sum + entry.wordCount, 0);
        console.log(`📈 Total word usage for user ${userId} in current billing cycle: ${totalWords}`);
        return totalWords;
      } else {
        console.log(`📊 No word usage entries found for user ${userId} in current billing cycle`);
        return 0;
      }
    } catch (error) {
      console.error(`❌ Error calculating current billing cycle word usage for user ${userId}:`, error);
      return 0;
    }
  }



  private calculateUserBillingCycleEnd(cycleStart: Date): Date {
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    cycleEnd.setTime(cycleEnd.getTime() - 1); // End of day before next cycle
    return cycleEnd;
  }
  
  async getOrCreateCurrentBillingCycle(userId: number): Promise<UserWordUsage> {
    // Note: This method is deprecated - use wordUsageUtils.ts for authentic Stripe billing cycles
    
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
  
  // Subscription plan operations - NOW DEPRECATED! USE STRIPE API INSTEAD
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    console.error("⛔️ DEPRECATED: getSubscriptionPlans() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    // Default plans that match Stripe for development
    const hardcodedPlans: SubscriptionPlan[] = [
      {
        id: 1,
        planCode: "starter",
        name: "Starter",
        monthlyWordLimit: 500, // Updated to match Stripe
        monthlyPriceUsd: "0",
        yearlyPriceUsd: "0",
        features: ["500 words per month", "Basic analytics", "Up to 3 leader models"],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        planCode: "pro",
        name: "Pro",
        monthlyWordLimit: 15000,
        monthlyPriceUsd: "9.99",
        yearlyPriceUsd: "99",
        features: ["15,000 words per month", "Advanced analytics", "Up to 5 leader models", "Priority support"],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        planCode: "executive",
        name: "Executive",
        monthlyWordLimit: 50000,
        monthlyPriceUsd: "29",
        yearlyPriceUsd: "199",
        features: ["50,000 words per month", "Premium analytics", "Unlimited leader models", "24/7 priority support", "Custom leader models"],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // For backward compatibility, still return the plans from DB but log the warning
    const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.monthlyWordLimit);
    return plans.length > 0 ? plans : hardcodedPlans;
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    console.error("⛔️ DEPRECATED: getSubscriptionPlan() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return result[0];
  }
  
  async getSubscriptionPlanByCode(planCode: string): Promise<SubscriptionPlan | undefined> {
    console.error("⛔️ DEPRECATED: getSubscriptionPlanByCode() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    // Default plans for starter to ensure consistency
    if (planCode.toLowerCase() === "starter") {
      return {
        id: 1,
        planCode: "starter",
        name: "Starter",
        monthlyWordLimit: 500, // Updated to match Stripe
        monthlyPriceUsd: "0",
        yearlyPriceUsd: "0",
        features: ["500 words per month", "Basic analytics", "Up to 3 leader models"],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planCode, planCode));
    return result[0];
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    console.error("⛔️ DEPRECATED: createSubscriptionPlan() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    // Still execute for backward compatibility
    if (plan.isDefault) {
      await db.update(subscriptionPlans).set({ isDefault: false }).where(eq(subscriptionPlans.isDefault, true));
    }
    
    const result = await db.insert(subscriptionPlans).values(plan).returning();
    return result[0];
  }
  
  async updateSubscriptionPlan(id: number, data: UpdateSubscriptionPlan): Promise<SubscriptionPlan | undefined> {
    console.error("⛔️ DEPRECATED: updateSubscriptionPlan() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    // Still execute for backward compatibility
    if (data.isDefault) {
      await db.update(subscriptionPlans).set({ isDefault: false }).where(eq(subscriptionPlans.isDefault, true));
    }
    
    const result = await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id)).returning();
    return result[0];
  }
  
  async getDefaultSubscriptionPlan(): Promise<SubscriptionPlan> {
    console.error("⛔️ DEPRECATED: getDefaultSubscriptionPlan() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    // Return the Starter plan with 500 words to match Stripe
    return {
      id: 1,
      planCode: "starter",
      name: "Starter",
      monthlyWordLimit: 500, // Updated to match Stripe
      monthlyPriceUsd: "0",
      yearlyPriceUsd: "0",
      features: ["500 words per month", "Basic analytics", "Up to 3 leader models"],
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  // Initialize default subscription plans - DEPRECATED
  async initializeSubscriptionPlans(): Promise<void> {
    console.error("⛔️ DEPRECATED: initializeSubscriptionPlans() called - use Stripe API instead");
    console.trace("Stack trace for deprecated method call");
    
    // No-op - we're not initializing plans from the database anymore
    console.log("Subscription plans should be managed in Stripe, not the database");
  }
}

// Export a singleton instance
export const dbStorage = new DatabaseStorage();

// Subscription plans are now managed in Stripe - no database initialization needed