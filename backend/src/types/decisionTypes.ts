export interface DecisionContext {
  urgency: 'low' | 'medium' | 'high';
  importance: 'low' | 'medium' | 'high';
  category: string;
  stakeholders: string[];
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface Decision {
  id: string;
  userId: number;
  title: string;
  description: string;
  context: DecisionContext;
  createdAt: Date;
}

export interface DecisionAnalysis {
  id: string;
  decisionId?: string;
  recommendations: string[];
  optionAnalysis?: Array<{
    optionId: string;
    analysis: string;
    strength: number;
  }>;
  summary: string;
  createdAt: Date;
}

export interface DecisionResult {
  decisionId: string;
  chosenOptionId: string;
  reasoning: string;
  updatedAt: Date;
}

export interface CreateDecisionResponse {
  msg: string;
  decisionId: string;
}

export interface AnalysisResponse {
  msg: string;
  analysis: string;
}

export interface HistoryResponse {
  msg: string;
  history: any;
  count: number;
}