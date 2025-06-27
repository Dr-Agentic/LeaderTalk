import { 
  users, leaders, recordings, leaderAlternatives, userWordUsage,
  type User, type InsertUser, type UpdateUser,
  type Leader, type InsertLeader,
  type Recording, type InsertRecording, type UpdateRecording,
  type LeaderAlternative, type InsertLeaderAlternative,
  type UserWordUsage, type InsertUserWordUsage, type UpdateUserWordUsage,
  type AnalysisResult
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  
  // Leader operations
  getLeaders(): Promise<Leader[]>;
  getLeader(id: number): Promise<Leader | undefined>;
  getLeadersByIds(ids: number[]): Promise<Leader[]>;
  createLeader(leader: InsertLeader): Promise<Leader>;
  
  // Recording operations
  getRecordings(userId: number): Promise<Recording[]>;
  getRecording(id: number): Promise<Recording | undefined>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  updateRecording(id: number, data: UpdateRecording): Promise<Recording | undefined>;
  updateRecordingAnalysis(id: number, transcription: string, analysisResult: AnalysisResult): Promise<Recording | undefined>;
  
  // Leader alternatives operations
  getLeaderAlternative(leaderId: number, originalText: string): Promise<LeaderAlternative | undefined>;
  createLeaderAlternative(alternative: InsertLeaderAlternative): Promise<LeaderAlternative>;
  getLeaderAlternatives(leaderId: number): Promise<LeaderAlternative[]>;
  
  // Word usage tracking operations
  getUserWordUsage(userId: number): Promise<UserWordUsage[]>;

  createUserWordUsage(usage: InsertUserWordUsage): Promise<UserWordUsage>;
  updateUserWordUsage(id: number, data: UpdateUserWordUsage): Promise<UserWordUsage | undefined>;
  getCurrentWordUsage(userId: number): Promise<number>;
  
  // Subscription plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByCode(planCode: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, data: UpdateSubscriptionPlan): Promise<SubscriptionPlan | undefined>;
  getDefaultSubscriptionPlan(): Promise<SubscriptionPlan>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leaders: Map<number, Leader>;
  private recordings: Map<number, Recording>;
  private leaderAlternatives: Map<string, LeaderAlternative>;
  private wordUsages: Map<number, UserWordUsage>;
  
  private userIdCounter: number;
  private leaderIdCounter: number;
  private recordingIdCounter: number;
  private leaderAlternativeIdCounter: number;
  private wordUsageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.leaders = new Map();
    this.recordings = new Map();
    this.leaderAlternatives = new Map();
    this.wordUsages = new Map();
    
    this.userIdCounter = 1;
    this.leaderIdCounter = 1;
    this.recordingIdCounter = 1;
    this.leaderAlternativeIdCounter = 1;
    this.wordUsageIdCounter = 1;
    
    // Initialize with some default leaders
    this.initDefaultLeaders();
  }

  private initDefaultLeaders() {
    const defaultLeaders: InsertLeader[] = [
      {
        name: "Nelson Mandela",
        title: "Anti-apartheid revolutionary, political leader, philanthropist",
        description: "Known for his ability to inspire through compassionate, thoughtful communication even in difficult situations.",
        traits: ["Inspirational", "Empathetic"],
        biography: "Nelson Mandela was a South African anti-apartheid revolutionary, political leader, and philanthropist who served as President of South Africa from 1994 to 1999. He was the country's first black head of state and the first elected in a fully representative democratic election.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/02/Nelson_Mandela_1994.jpg",
      },
      {
        name: "Barack Obama",
        title: "44th U.S. President, attorney, author",
        description: "Renowned for his powerful oratory skills and ability to connect with diverse audiences through measured speech.",
        traits: ["Articulate", "Persuasive"],
        biography: "Barack Obama served as the 44th president of the United States from 2009 to 2017. Obama was the first African-American president of the United States. Before his presidency, he served as a U.S. senator from Illinois and a state senator from Illinois.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/1200px-President_Barack_Obama.jpg",
      },
      {
        name: "Malala Yousafzai",
        title: "Education activist, Nobel Peace Prize laureate",
        description: "Known for her clear, direct communication style that powerfully advocates for education and women's rights.",
        traits: ["Bold", "Passionate"],
        biography: "Malala Yousafzai is a Pakistani activist for female education and the youngest Nobel Prize laureate. She is known for human rights advocacy, especially the education of women and children in her native Swat Valley in northwest Pakistan.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/08/Malala_Yousafzai_at_Girl_Summit_2014.jpg",
      }
    ];
    
    defaultLeaders.forEach(leader => this.createLeader(leader));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }
  
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.stripeCustomerId === stripeCustomerId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Leader operations
  async getLeaders(): Promise<Leader[]> {
    return Array.from(this.leaders.values());
  }

  async getLeader(id: number): Promise<Leader | undefined> {
    return this.leaders.get(id);
  }

  async getLeadersByIds(ids: number[]): Promise<Leader[]> {
    return ids
      .map(id => this.leaders.get(id))
      .filter((leader): leader is Leader => leader !== undefined);
  }

  async createLeader(leader: InsertLeader): Promise<Leader> {
    const id = this.leaderIdCounter++;
    const newLeader: Leader = { ...leader, id };
    this.leaders.set(id, newLeader);
    return newLeader;
  }

  // Recording operations
  async getRecordings(userId: number): Promise<Recording[]> {
    return Array.from(this.recordings.values())
      .filter(recording => recording.userId === userId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async createRecording(recording: InsertRecording): Promise<Recording> {
    const id = this.recordingIdCounter++;
    const newRecording: Recording = { 
      ...recording, 
      id, 
      recordedAt: new Date(),
      status: "processing",
      transcription: undefined,
      analysisResult: undefined
    };
    this.recordings.set(id, newRecording);
    return newRecording;
  }

  async updateRecording(id: number, data: UpdateRecording): Promise<Recording | undefined> {
    const recording = this.recordings.get(id);
    if (!recording) return undefined;
    
    const updatedRecording: Recording = { ...recording, ...data };
    this.recordings.set(id, updatedRecording);
    return updatedRecording;
  }

  async updateRecordingAnalysis(id: number, transcription: string, analysisResult: AnalysisResult): Promise<Recording | undefined> {
    const recording = this.recordings.get(id);
    if (!recording) return undefined;
    
    const updatedRecording: Recording = { 
      ...recording, 
      transcription, 
      analysisResult,
      status: "completed" 
    };
    this.recordings.set(id, updatedRecording);
    return updatedRecording;
  }
  
  // Leader alternatives operations
  async getLeaderAlternative(leaderId: number, originalText: string): Promise<LeaderAlternative | undefined> {
    const key = `${leaderId}:${originalText}`;
    return this.leaderAlternatives.get(key);
  }
  
  async createLeaderAlternative(alternative: InsertLeaderAlternative): Promise<LeaderAlternative> {
    const id = this.leaderAlternativeIdCounter++;
    const key = `${alternative.leaderId}:${alternative.originalText}`;
    const newAlternative: LeaderAlternative = { 
      ...alternative, 
      id, 
      createdAt: new Date() 
    };
    this.leaderAlternatives.set(key, newAlternative);
    return newAlternative;
  }
  
  async getLeaderAlternatives(leaderId: number): Promise<LeaderAlternative[]> {
    return Array.from(this.leaderAlternatives.values())
      .filter(alt => alt.leaderId === leaderId);
  }
  
  // Word usage tracking operations
  async getUserWordUsage(userId: number): Promise<UserWordUsage[]> {
    return Array.from(this.wordUsages.values())
      .filter(usage => usage.userId === userId)
      .sort((a, b) => {
        // Sort by cycle number (descending)
        return b.cycleNumber - a.cycleNumber;
      });
  }
  

  
  async createUserWordUsage(usage: InsertUserWordUsage): Promise<UserWordUsage> {
    const id = this.wordUsageIdCounter++;
    const now = new Date();
    const newUsage: UserWordUsage = {
      ...usage,
      id,
      wordCount: usage.wordCount || 0, // Ensure wordCount is not undefined
      createdAt: now,
      updatedAt: now
    };
    this.wordUsages.set(id, newUsage);
    return newUsage;
  }
  
  async updateUserWordUsage(id: number, data: UpdateUserWordUsage): Promise<UserWordUsage | undefined> {
    const usage = this.wordUsages.get(id);
    if (!usage) return undefined;
    
    const updatedUsage: UserWordUsage = { 
      ...usage, 
      ...data,
      updatedAt: new Date() 
    };
    this.wordUsages.set(id, updatedUsage);
    return updatedUsage;
  }
  
  async getCurrentWordUsage(userId: number): Promise<number> {
    // This method is deprecated - use wordUsageUtils.ts for authentic Stripe billing cycles
    // For MemStorage, return simple total
    return Array.from(this.wordUsages.values())
      .filter(usage => usage.userId === userId)
      .reduce((total, usage) => total + usage.wordCount, 0);
  }
}

// Import the database storage implementation
import { dbStorage } from './dbStorage';

// Use the database storage instead of memory storage
export const storage = dbStorage;

// Initialize default leaders
dbStorage.initializeDefaultLeaders().catch(err => {
  console.error('Failed to initialize default leaders:', err);
});
