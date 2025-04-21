import OpenAI from "openai";
import fs from "fs";
import { Leader, Recording, AnalysisResult } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAndAnalyzeAudio(
  audioPath: string,
  recording: Recording,
  leaders: Leader[]
): Promise<{ transcription: string; analysis: AnalysisResult }> {
  try {
    // Step 1: Transcribe the audio
    const transcription = await transcribeAudio(audioPath);
    
    // Step 2: Analyze the transcription
    const analysis = await analyzeTranscription(transcription, leaders);
    
    return { transcription, analysis };
  } catch (error) {
    console.error("Error in transcription and analysis:", error);
    throw error;
  }
}

async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const audioReadStream = fs.createReadStream(audioPath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "text",
    });
    
    return transcription.text;
  } catch (error) {
    console.error("Error in audio transcription:", error);
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
    
    const result = JSON.parse(response.choices[0].message.content);
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
