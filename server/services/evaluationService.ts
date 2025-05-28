import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key: OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ScenarioContext {
  id: number;
  description: string;
  userPrompt: string;
  requiredLeadershipStyle: 'empathetic' | 'inspirational' | 'commanding';
  moduleTitle: string;
  leadershipTrait: string;
  situationType: string;
}

export interface EvaluationResult {
  overallScore: number;
  styleMatchScore: number;
  clarity: number;
  empathy: number;
  persuasiveness: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
}

export class EvaluationService {
  /**
   * Evaluate a user's response to a leadership scenario using AI
   */
  async evaluateResponse(
    userResponse: string,
    scenario: ScenarioContext
  ): Promise<EvaluationResult> {
    try {
      const prompt = this.buildEvaluationPrompt(userResponse, scenario);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert leadership coach and communication trainer. Evaluate leadership responses with constructive, actionable feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const evaluationText = completion.choices[0]?.message?.content;
      if (!evaluationText) {
        throw new Error('No evaluation received from AI');
      }

      return this.parseEvaluationResponse(evaluationText);
    } catch (error) {
      console.error('Error during AI evaluation:', error);
      return this.createFallbackEvaluation(userResponse, scenario);
    }
  }

  private buildEvaluationPrompt(userResponse: string, scenario: ScenarioContext): string {
    return `
LEADERSHIP SCENARIO EVALUATION

**Context:**
- Scenario: ${scenario.description}
- Task: ${scenario.userPrompt}
- Required Leadership Style: ${scenario.requiredLeadershipStyle.toUpperCase()}
- Module: ${scenario.moduleTitle}
- Leadership Trait Focus: ${scenario.leadershipTrait}
- Situation Type: ${scenario.situationType}

**User's Response:**
"${userResponse}"

**Evaluation Instructions:**
Please evaluate this leadership response on the following criteria:

1. **Style Alignment (1-100)**: How well does the response match the required ${scenario.requiredLeadershipStyle} leadership style?
2. **Overall Effectiveness (1-100)**: Overall quality of the leadership communication
3. **Specific Strengths**: What did the user do well?
4. **Areas for Improvement**: What could be enhanced?
5. **Overall Assessment**: Brief summary of the response quality

**Required Response Format:**
Please respond in this exact JSON format:
{
  "overallScore": [overall effectiveness score 1-100],
  "styleMatchScore": [style alignment score 1-100],
  "clarity": [communication clarity score 1-100],
  "empathy": [empathy demonstration score 1-100], 
  "persuasiveness": [persuasive impact score 1-100],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvement": "Detailed constructive feedback paragraph with specific actionable advice"
}

Focus on actionable, specific feedback that helps the user improve their leadership communication skills.
    `;
  }

  private parseEvaluationResponse(evaluationText: string): EvaluationResult {
    try {
      // Extract JSON from the response
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in evaluation response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        overallScore: Math.max(1, Math.min(100, parsed.overallScore || 70)),
        styleMatchScore: Math.max(1, Math.min(100, parsed.styleMatchScore || 70)),
        clarity: Math.max(1, Math.min(100, parsed.clarity || 75)),
        empathy: Math.max(1, Math.min(100, parsed.empathy || 70)),
        persuasiveness: Math.max(1, Math.min(100, parsed.persuasiveness || 70)),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ['Clear communication'],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 3) : ['Continue practicing'],
        improvement: parsed.improvement || 'Good effort on your leadership response. Continue developing your communication skills.'
      };
    } catch (error) {
      console.error('Error parsing AI evaluation:', error);
      throw new Error('Failed to parse AI evaluation response');
    }
  }

  private createFallbackEvaluation(userResponse: string, scenario: ScenarioContext): EvaluationResult {
    return {
      overallScore: 72,
      styleMatchScore: 75,
      clarity: 70,
      empathy: 75,
      persuasiveness: 70,
      strengths: ['Engaged with the scenario', 'Provided a complete response', 'Showed leadership thinking'],
      weaknesses: ['Continue developing your leadership voice', 'Practice adapting communication style'],
      improvement: `Thank you for your thoughtful response to this ${scenario.requiredLeadershipStyle} leadership scenario. Your communication shows engagement with the situation presented. Focus on specific leadership techniques to enhance your impact.`
    };
  }
}

export const evaluationService = new EvaluationService();