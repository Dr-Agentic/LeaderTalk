import OpenAI from "openai";
import fs from "fs";
import { Leader, Recording, AnalysisResult } from "@shared/schema";
import { storage } from "./storage";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAndAnalyzeAudio(
  recording: Recording,
  audioPath: string
): Promise<{ transcription: string; analysis: AnalysisResult }> {
  try {
    console.log("Starting transcription and analysis of audio:", {
      audioPath,
      recordingId: recording.id
    });
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      // Return a simplified analysis result when API key is missing
      return {
        transcription: "Could not process audio due to missing API key.",
        analysis: createDefaultAnalysis("API key not configured, please add OPENAI_API_KEY to your environment variables.")
      };
    }
    
    // 1. Try to transcribe the audio
    let transcription = "";
    try {
      // Step 1: Transcribe the audio
      transcription = await transcribeAudio(audioPath);
      console.log("Successfully transcribed audio, length:", transcription.length);
      
      if (!transcription || transcription.trim().length < 10) {
        console.warn("Transcription too short or empty");
        return {
          transcription: "No speech detected in audio",
          analysis: createDefaultAnalysis("No speech detected in the recording. Please ensure your microphone is working properly.")
        };
      }
      
      // Count words in the transcription
      const wordCount = countWords(transcription);
      console.log(`Word count in transcription: ${wordCount}`);
      
      // Update the recording with the word count (use existing title and duration)
      await storage.updateRecording(recording.id, { 
        wordCount,
        title: recording.title,
        duration: recording.duration
      });
      
      // Update the monthly usage for the user
      await updateUserWordUsage(recording.userId, wordCount);
      
    } catch (transcriptError) {
      console.error("Error transcribing audio:", transcriptError);
      console.error("Transcription error details:", {
        message: transcriptError instanceof Error ? transcriptError.message : 'Unknown error',
        stack: transcriptError instanceof Error ? transcriptError.stack : 'No stack trace',
        audioPath: audioPath
      });
      return {
        transcription: "Failed to transcribe audio",
        analysis: createDefaultAnalysis("We had trouble processing your audio. Please ensure it's a clear recording.")
      };
    }
    
    try {
      // Step 2: Get leaders and analyze the transcription
      const leaders = await storage.getLeaders();
      const analysis = await analyzeTranscription(transcription, leaders);
      return { transcription, analysis };
    } catch (analysisError) {
      console.error("Error analyzing transcription:", analysisError);
      return {
        transcription,
        analysis: createDefaultAnalysis("Successfully transcribed audio but encountered an error during analysis.")
      };
    }
  } catch (error) {
    console.error("Error in transcription and analysis:", error);
    return {
      transcription: "Processing error",
      analysis: createDefaultAnalysis("An unexpected error occurred while processing your recording.")
    };
  }
}

// Function to count words in a text string
function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove extra whitespace and split by spaces
  const words = text.trim().split(/\s+/);
  return words.filter(word => word.length > 0).length;
}

// Function to update the user's word usage for the current billing cycle
async function updateUserWordUsage(userId: number, wordCount: number): Promise<void> {
  try {
    // Get or create the billing cycle for this user
    const currentCycle = await storage.getOrCreateCurrentBillingCycle(userId);
    
    if (currentCycle) {
      // Update existing cycle record
      const newWordCount = currentCycle.wordCount + wordCount;
      // Extract current year and month from the cycle for the update
      const date = new Date(currentCycle.cycleStartDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-based
      
      await storage.updateUserWordUsage(currentCycle.id, { 
        wordCount: newWordCount,
        year,
        month
      });
      console.log(`Updated word usage for user ${userId} (cycle #${currentCycle.cycleNumber}): ${currentCycle.wordCount} -> ${newWordCount}`);
      
      // Log billing cycle information for debugging
      const cycleStart = new Date(currentCycle.cycleStartDate).toISOString().split('T')[0];
      const cycleEnd = new Date(currentCycle.cycleEndDate).toISOString().split('T')[0];
      console.log(`Current billing cycle: ${cycleStart} to ${cycleEnd}`);
    } else {
      // This should not happen as getOrCreateCurrentBillingCycle should always return a cycle
      console.error(`Failed to get or create billing cycle for user ${userId}`);
    }
  } catch (error) {
    console.error("Error updating user word usage:", error);
    // Don't throw - we don't want to break the transcription process
  }
}

// Helper function to create a default analysis result when errors occur
function createDefaultAnalysis(reason: string): AnalysisResult {
  return {
    overview: {
      rating: "Needs improvement overall",
      score: 5,
      summary: reason
    },
    timeline: [
      {
        timestamp: 0,
        value: 0,
        type: "neutral",
      },
    ],
    positiveInstances: [],
    negativeInstances: [],
    passiveInstances: [],
    leadershipInsights: [],
  };
}

/**
 * Generates an alternative phrase for a negative communication moment based on a leader's style
 * and caches the result for future use.
 * 
 * @param leaderId The ID of the leader to emulate
 * @param originalText The negative communication text to transform
 * @param leaderInfo Optional leader details to avoid extra database lookups
 * @returns The alternative text in the leader's style
 */
export async function generateLeaderAlternative(
  leaderId: number,
  originalText: string,
  userId?: number,
  leaderInfo?: Leader
): Promise<string> {
  try {
    // Check if we already have a cached version
    const existingAlternative = await storage.getLeaderAlternative(leaderId, originalText);
    if (existingAlternative) {
      console.log(`Found cached leader alternative for leader ${leaderId} and text "${originalText.substring(0, 20)}..."`);
      return existingAlternative.alternativeText;
    }
    
    // If not cached, we need to generate a new one
    console.log(`Generating new leader alternative for leader ${leaderId} and text "${originalText.substring(0, 20)}..."`);
    
    // Get leader info if not provided
    const leader = leaderInfo || await storage.getLeader(leaderId);
    if (!leader) {
      throw new Error(`Leader with ID ${leaderId} not found`);
    }
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return `[Alternative response could not be generated - API key missing]`;
    }
    
    // Build a prompt for the leader's style
    let leadershipStyles = "";
    if (leader.leadershipStyles && leader.leadershipStyles.length > 0) {
      leadershipStyles = leader.leadershipStyles.join(", ");
    }
    
    let leaderTraits = "";
    if (leader.traits && leader.traits.length > 0) {
      leaderTraits = leader.traits.join(", ");
    }
    
    // Create a prompt that asks OpenAI to generate an alternative
    const prompt = `
      You are ${leader.name}, a leader known for ${leader.description}.
      
      Your leadership style is characterized as: ${leadershipStyles || "balanced and effective"}
      Your key traits are: ${leaderTraits || "effective communication, empathy, and clarity"}
      
      You need to rephrase the following negative communication in your authentic voice and style:
      
      "${originalText}"
      
      Rewrite this text to reflect how you would express the same core message but in a more effective, 
      leadership-oriented way. Keep your response brief (25-50 words), focused, and in your characteristic style.
      Don't introduce yourself or explain - just provide the rephrased text as you would say it.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are emulating the communication style of ${leader.name}. Respond as if you are this person, staying true to their known communication patterns, vocabulary, and tone.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150, // Keep it concise
    });
    
    // Handle null response content (shouldn't happen, but TypeScript is warning about it)
    const firstChoice = response.choices[0];
    const messageContent = firstChoice && firstChoice.message && firstChoice.message.content ? firstChoice.message.content : '';
    const alternativeText = messageContent.trim();
    
    // Store in database for future use with the creator's user ID
    await storage.createLeaderAlternative({
      leaderId,
      originalText,
      alternativeText,
      createdBy: userId || undefined
    });
    
    return alternativeText;
  } catch (error) {
    console.error("Error generating leader alternative:", error);
    return `[Error generating alternative - ${error instanceof Error ? error.message : "unknown error"}]`;
  }
}

async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    // Check if file exists and get its stats
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file does not exist at path: ${audioPath}`);
    }
    
    const stats = fs.statSync(audioPath);
    console.log(`Audio file size: ${stats.size} bytes, last modified: ${stats.mtime}`);
    
    if (stats.size === 0) {
      throw new Error("Audio file is empty (0 bytes)");
    }
    
    // Analyze file size to identify potential issues
    if (stats.size < 1024) { // Less than 1KB
      console.warn("Audio file is very small (<1KB), likely corrupted or empty");
    } else if (stats.size < 5 * 1024) { // Less than 5KB
      console.warn("Audio file is small (<5KB), might be too short or corrupted");
    } else {
      console.log(`Audio file appears to be of reasonable size: ${(stats.size / 1024).toFixed(2)}KB`);
    }
    
    // Read the first few bytes to check if the file format seems valid
    try {
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(audioPath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      
      console.log(`File header bytes: ${buffer.toString('hex')}`);
      
      // Check for common audio file signatures
      const isWebm = buffer.toString('ascii', 0, 4) === '%\x9F\x80\x8A'; // WebM
      const isWav = buffer.toString('ascii', 0, 4) === 'RIFF'; // WAV
      const isMp3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33; // MP3 with ID3
      
      if (!isWebm && !isWav && !isMp3) {
        console.warn("Audio file does not have a recognized audio format signature");
      }
    } catch (headerError) {
      console.warn("Could not analyze audio file header", headerError);
    }
    
    // Create readable stream
    const audioReadStream = fs.createReadStream(audioPath);
    
    // Log file info before sending to OpenAI
    console.log(`Sending audio file ${audioPath} to OpenAI for transcription`);
    
    // Send to OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "text",
      // Using auto language detection (removed explicit language parameter)
    });
    
    // Log the transcription for debugging
    console.log(`Transcription received, first 50 chars: "${transcription.substring(0, 50)}..."`);
    
    // Log detected language characteristics for debugging
    // Note: With auto-detection now enabled, we expect to see various scripts
    // This is just for logging purposes to help diagnose potential transcription issues
    const scriptAnalysis = {
      latin: (transcription.match(/[a-zA-Z]/g) || []).length,
      cyrillic: (transcription.match(/[\u0400-\u04FF]/g) || []).length,
      cjk: (transcription.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g) || []).length,
      arabic: (transcription.match(/[\u0600-\u06FF]/g) || []).length,
      devanagari: (transcription.match(/[\u0900-\u097F]/g) || []).length,
      total: transcription.length
    };
    
    // Log script detection
    if (scriptAnalysis.total > 0) {
      const dominantScript = Object.entries(scriptAnalysis)
        .filter(([key]) => key !== 'total')
        .sort(([, a], [, b]) => b - a)[0];
      
      console.log(
        `Transcription language analysis: ${dominantScript[0]} script appears dominant (${Math.floor((dominantScript[1] / scriptAnalysis.total) * 100)}%)`
      );
    }
    
    // Return the transcription text
    return transcription;
  } catch (error) {
    console.error("Error in audio transcription:", error);
    // If OpenAI API fails due to format issues, return this message
    if (error instanceof Error && error.message.includes("format")) {
      console.error("Audio format error detected - unsupported audio format");
    }
    throw error;
  }
}

async function analyzeTranscription(
  transcription: string,
  leaders: Leader[]
): Promise<AnalysisResult> {
  try {
    const leadersList = leaders.map(leader => ({
      id: leader.id,
      name: leader.name,
      traits: leader.traits,
      description: leader.description
    }));
    
    const prompt = `
      You are an expert communication coach helping a user improve their speaking style by analyzing their conversation transcript.
      
      Here's the transcript to analyze: 
      
      "${transcription}"
      
      Please analyze this transcript for:
      1. Positive communication moments (effective, clear, persuasive)
      2. Negative communication moments (interruptions, unclear, defensive)
      3. Passive communication moments (hesitation, lack of confidence)
      
      Also create a timeline of the speaker's emotional tone throughout the conversation,
      with timestamps approximately every 30 seconds, scoring from -1 (very negative) to 1 (very positive).
      
      The user admires these leaders and their communication styles:
      ${JSON.stringify(leadersList, null, 2)}
      
      For each leader, provide specific advice on how the speaker could have communicated more like that leader.
      
      Provide your analysis as a JSON object with the following structure:
      {
        "overview": {
          "rating": "Good/Average/Needs Improvement",
          "score": 0-100,
          "summary": "Brief overall assessment"
        },
        "timeline": [
          {
            "timestamp": seconds from start,
            "value": -1.0 to 1.0,
            "type": "positive/negative/neutral/passive"
          }
        ],
        "positiveInstances": [
          {
            "timestamp": seconds from start,
            "text": "exact quote from transcript",
            "analysis": "why this was effective"
          }
        ],
        "negativeInstances": [
          {
            "timestamp": seconds from start,
            "text": "exact quote from transcript",
            "analysis": "why this was ineffective",
            "improvement": "suggestion for improvement"
          }
        ],
        "passiveInstances": [
          {
            "timestamp": seconds from start,
            "text": "exact quote from transcript",
            "analysis": "why this was passive",
            "improvement": "suggestion for improvement"
          }
        ],
        "leadershipInsights": [
          {
            "leaderId": leader's ID,
            "leaderName": "leader's name",
            "advice": "specific advice based on this leader's style"
          }
        ]
      }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert communication coach specializing in leadership communication styles.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });
    
    // Handle potential null content (TypeScript warning)
    const firstChoice = response.choices[0];
    const messageContent = firstChoice && firstChoice.message && firstChoice.message.content ? firstChoice.message.content : '{}';
    const result = JSON.parse(messageContent);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Error in transcript analysis:", error);
    
    // Return a basic error analysis if OpenAI fails
    return {
      overview: {
        rating: "Error",
        score: 0,
        summary: "An error occurred during analysis. Please try again.",
      },
      timeline: [
        {
          timestamp: 0,
          value: 0,
          type: "neutral",
        },
      ],
      positiveInstances: [],
      negativeInstances: [],
      passiveInstances: [],
      leadershipInsights: [],
    };
  }
}
