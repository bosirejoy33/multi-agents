
import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, SharedState, AgentResponse, Recommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recommendationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      year: { type: Type.STRING },
      rating: { type: Type.STRING },
      rationale: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['movie', 'series'] }
    },
    required: ['title', 'year', 'rating', 'rationale', 'type']
  }
};

export class AgentService {
  
  static async runProfiler(state: SharedState): Promise<AgentResponse> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User said: "${state.userQuery}". Based on this, extract a detailed user profile including preferred genres, mood, themes, and any mentioned favorite movies/series. Output a concise profile string.`,
    });
    
    return {
      updatedState: { profile: response.text || "Unknown" },
      nextAgent: AgentRole.RESEARCHER,
      log: "I've analyzed your vibes! Mapping out your cinematic DNA..."
    };
  }

  static async runResearcher(state: SharedState): Promise<AgentResponse> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Use Google Search to find current highly-rated movies and series that match this profile: ${state.profile}. Look for recent ratings on IMDB and Rotten Tomatoes. Provide a summary of current trending titles that fit.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) || [];

    return {
      updatedState: { researchData: `${response.text}\n\nSources: ${sources.join(', ')}` },
      nextAgent: AgentRole.CURATOR,
      log: `Scanning databases for high-score hits... Found some fresh metadata from ${sources.length} sources!`
    };
  }

  static async runCurator(state: SharedState): Promise<AgentResponse> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the profile: ${state.profile} and research: ${state.researchData}, curate exactly 3-5 specific movie or series recommendations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema
      }
    });

    let recs: Recommendation[] = [];
    try {
      recs = JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse curator JSON", e);
    }

    return {
      updatedState: { draftRecommendations: recs },
      nextAgent: AgentRole.CRITIC,
      log: "Mixing the perfect recommendation cocktail. Here's my first draft list!"
    };
  }

  static async runCritic(state: SharedState): Promise<AgentResponse> {
    const recsStr = JSON.stringify(state.draftRecommendations);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Critique these recommendations: ${recsStr} for a user with profile: ${state.profile}. Are they too obvious? Do they actually match? Give constructive feedback to improve them or approve them if they are perfect. Start your response with APPROVED or REJECTED.`,
    });

    const isApproved = response.text?.trim().startsWith("APPROVED");

    return {
      updatedState: { 
        criticFeedback: response.text || "",
        isHumanApprovalRequired: isApproved // We let the human have the final say if the critic likes it
      },
      nextAgent: isApproved ? 'HUMAN' : AgentRole.CURATOR,
      log: isApproved 
        ? "These look rad! Ready for your approval." 
        : "Hold up, I've got some notes. Sending these back for refinement."
    };
  }

  static async runSupervisor(state: SharedState): Promise<AgentResponse> {
    // The supervisor logic is handled by the main app loop, but we can use an LLM
    // to decide if we've hit a termination condition or if we need more steps.
    if (state.currentTurn >= state.maxTurns) {
      return {
        updatedState: { status: 'completed' },
        nextAgent: 'FINISH',
        log: "Reached max turns. Stopping orchestration."
      };
    }

    // Logic for next agent based on state status
    if (!state.profile) return this.runProfiler(state);
    if (!state.researchData) return this.runResearcher(state);
    if (state.draftRecommendations.length === 0) return this.runCurator(state);
    if (!state.criticFeedback) return this.runCritic(state);

    return {
      updatedState: {},
      nextAgent: 'FINISH',
      log: "Pipeline completed."
    };
  }
}
