export interface Candidate {
  id: string; // anonymized ID e.g., CAND-001
  originalText: string;
  anonymizedText: string;
  skills: {
    technical: string[];
    soft: string[];
    credentials: string[];
  };
  metrics: {
    technicalScore: number;
    softScore: number;
    credentialScore: number;
  };
  scores: {
    skill: number;
    biasOriginal: number;    // Simulated bias score if PII was present
    biasAnonymized: number;  // Bias score after anon (should be much lower)
    fit: number;
  };
  demographics: {
    gender: string;
    location: string;
  };
  status: 'Shortlisted' | 'Reviewed' | 'Rejected' | 'Pending';
  explanation: string;
  uploadDate: string;
  auditTrail: Array<{
    timestamp: string;
    reviewerId: string;
    action: string;
    reason: string;
  }>;
}

export interface JDScanResult {
  flaggedPhrases: Array<{
    phrase: string;
    reason: string;
    suggestion: string;
  }>;
  overallBiasScore: number;
  cleanJD: string;
}

export interface ChartDataPoint {
  name: string;
  original: number;
  anonymized: number;
}
