
export enum AgentRole {
  SUPERVISOR = 'SUPERVISOR',
  PROFILER = 'PROFILER',
  RESEARCHER = 'RESEARCHER',
  CURATOR = 'CURATOR',
  CRITIC = 'CRITIC'
}

export interface Recommendation {
  title: string;
  year: string;
  rating: string;
  rationale: string;
  type: 'movie' | 'series';
}

export interface AgentLog {
  id: string;
  role: AgentRole;
  thought: string;
  timestamp: number;
}

export interface SharedState {
  userQuery: string;
  profile: string;
  researchData: string;
  draftRecommendations: Recommendation[];
  criticFeedback: string;
  finalRecommendations: Recommendation[];
  currentTurn: number;
  maxTurns: number;
  isHumanApprovalRequired: boolean;
  status: 'idle' | 'processing' | 'awaiting_human' | 'completed' | 'error';
}

export interface AgentResponse {
  updatedState: Partial<SharedState>;
  nextAgent: AgentRole | 'HUMAN' | 'FINISH';
  log: string;
}
