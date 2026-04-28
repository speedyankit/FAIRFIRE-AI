import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, loginWithGoogle, logout as firebaseLogout } from '../lib/firebase';
import { Candidate } from '../types';

interface AppState {
  candidates: Candidate[];
  jobDescription: string;
  setJobDescription: (jd: string) => void;
  addCandidate: (c: Candidate) => void;
  updateCandidateStatus: (id: string, status: Candidate['status'], reason: string) => void;
  clearCandidates: () => void;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authLoading: boolean;
}

const defaultJD = `We are looking for a rockstar Full Stack Developer to join our fast-paced ninja team. You should be young, energetic, and a great culture fit (work hard, play hard). Must have 5+ years of React and Python experience. Recent grads from top universities preferred.
`;

const demoCandidates: Candidate[] = [
  {
    id: "CAND-001",
    originalText: "John Doe. Male. 25 years old. Software Engineer with 3 years of React and Python experience...",
    anonymizedText: "[REDACTED NAME]. [REDACTED GENDER]. [REDACTED AGE] years old. Software Engineer with 3 years of React and Python experience...",
    skills: {
      technical: ["React", "Python", "JavaScript"],
      soft: ["Teamwork", "Communication"],
      credentials: ["B.S. Computer Science"]
    },
    metrics: { technicalScore: 90, softScore: 80, credentialScore: 70 },
    scores: {
      skill: 85,
      biasOriginal: 60,
      biasAnonymized: 5,
      fit: 80
    },
    demographics: { gender: "Male", location: "San Francisco, CA" },
    status: "Shortlisted",
    explanation: "Strong match on React and Python requirements. Anonymization removed gender and age signals.",
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    auditTrail: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), reviewerId: "HR-Admin", action: "Status Changed: Shortlisted", reason: "Strong technical fit verified." }
    ]
  },
  {
    id: "CAND-002",
    originalText: "Susan Smith. Female. 45 years old. Mother of two. Senior Dev with 15 years experience...",
    anonymizedText: "[REDACTED NAME]. [REDACTED GENDER]. [REDACTED AGE] years old. [REDACTED PARENTAL STATUS]. Senior Dev with 15 years experience...",
    skills: {
      technical: ["React", "Python", "System Design"],
      soft: ["Leadership", "Mentoring"],
      credentials: ["M.S. Computer Science"]
    },
    metrics: { technicalScore: 95, softScore: 90, credentialScore: 80 },
    scores: {
      skill: 92,
      biasOriginal: 82,
      biasAnonymized: 2,
      fit: 90
    },
    demographics: { gender: "Female", location: "Austin, TX" },
    status: "Shortlisted",
    explanation: "Excellent technical fit and leadership. High initial bias risk mitigated by removing age and maternal status.",
    uploadDate: new Date().toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  },
  {
    id: "CAND-003",
    originalText: "Jamal Washington. Male. 30 years old. Developer...",
    anonymizedText: "[REDACTED NAME]. Developer with full stack capabilities...",
    skills: { technical: ["React", "Java"], soft: ["Agile"], credentials: ["Bootcamp Grad"] },
    metrics: { technicalScore: 85, softScore: 70, credentialScore: 60 },
    scores: { skill: 78, biasOriginal: 75, biasAnonymized: 4, fit: 75 },
    demographics: { gender: "Male", location: "Chicago, IL" },
    status: "Reviewed",
    explanation: "Good React experience, missing Python.",
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  },
  {
    id: "CAND-004",
    originalText: "Priya Patel. Female. 23. Node.js backend developer...",
    anonymizedText: "[REDACTED NAME]. Node.js backend developer...",
    skills: { technical: ["Node.js", "Express", "Python"], soft: ["Problem Solving"], credentials: ["B.Tech CS"] },
    metrics: { technicalScore: 80, softScore: 75, credentialScore: 80 },
    scores: { skill: 79, biasOriginal: 65, biasAnonymized: 3, fit: 70 },
    demographics: { gender: "Female", location: "Seattle, WA" },
    status: "Pending",
    explanation: "Strong in Python/Backend but lacks React.",
    uploadDate: new Date().toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  },
  {
    id: "CAND-005",
    originalText: "Michael Chen. Male. 28. Frontend Specialist...",
    anonymizedText: "[REDACTED NAME]. Frontend Specialist...",
    skills: { technical: ["React", "TypeScript", "Tailwind"], soft: ["UI/UX"], credentials: [] },
    metrics: { technicalScore: 88, softScore: 80, credentialScore: 40 },
    scores: { skill: 79, biasOriginal: 55, biasAnonymized: 4, fit: 85 },
    demographics: { gender: "Male", location: "New York, NY" },
    status: "Shortlisted",
    explanation: "Outstanding React skills.",
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "HR-System", action: "Created", reason: "Autoshortlisted based on frontend spec" }]
  },
  {
    id: "CAND-006",
    originalText: "Elena Rodriguez. Female. 35. Software Architect...",
    anonymizedText: "[REDACTED NAME]. Software Architect...",
    skills: { technical: ["Python", "AWS", "React"], soft: ["Architecture", "Public Speaking"], credentials: ["AWS Certified Solutions Architect"] },
    metrics: { technicalScore: 92, softScore: 85, credentialScore: 90 },
    scores: { skill: 90, biasOriginal: 60, biasAnonymized: 1, fit: 95 },
    demographics: { gender: "Female", location: "Denver, CO" },
    status: "Shortlisted",
    explanation: "Overqualified but excellent match.",
    uploadDate: new Date().toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  },
  {
    id: "CAND-007",
    originalText: "David Kim. Male. 42. Database Admin...",
    anonymizedText: "[REDACTED NAME]. Database Admin...",
    skills: { technical: ["SQL", "MongoDB"], soft: ["Troubleshooting"], credentials: ["Oracle Cert"] },
    metrics: { technicalScore: 40, softScore: 60, credentialScore: 70 },
    scores: { skill: 50, biasOriginal: 70, biasAnonymized: 4, fit: 45 },
    demographics: { gender: "Male", location: "Bowie, MD" },
    status: "Rejected",
    explanation: "Lacks core React and Python requirements.",
    uploadDate: new Date().toISOString(),
    auditTrail: [
      { timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" },
      { timestamp: new Date().toISOString(), reviewerId: "HR-Admin", action: "Status Changed: Rejected", reason: "Not a full stack profile." }
    ]
  },
  {
    id: "CAND-008",
    originalText: "Aisha Johnson. Female. 26. Full stack...",
    anonymizedText: "[REDACTED NAME]. Full stack...",
    skills: { technical: ["React", "Django", "Python"], soft: ["Leadership"], credentials: ["M.S. CS"] },
    metrics: { technicalScore: 95, softScore: 80, credentialScore: 85 },
    scores: { skill: 90, biasOriginal: 75, biasAnonymized: 3, fit: 92 },
    demographics: { gender: "Female", location: "Atlanta, GA" },
    status: "Shortlisted",
    explanation: "Perfect stack overlap with Django/Python + React.",
    uploadDate: new Date().toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  },
  {
    id: "CAND-009",
    originalText: "Satoshi Tanaka. Male. 50. Legacy systems developer...",
    anonymizedText: "[REDACTED NAME]. Legacy systems developer...",
    skills: { technical: ["C++", "Java", "Python"], soft: ["Mentoring"], credentials: ["Ph.D CS"] },
    metrics: { technicalScore: 65, softScore: 80, credentialScore: 90 },
    scores: { skill: 73, biasOriginal: 85, biasAnonymized: 5, fit: 65 },
    demographics: { gender: "Male", location: "San Jose, CA" },
    status: "Reviewed",
    explanation: "Strong background, missing frontend React.",
    uploadDate: new Date().toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  },
  {
    id: "CAND-010",
    originalText: "Alex Vance. Non-binary. 29. Web Developer...",
    anonymizedText: "[REDACTED NAME]. Web Developer...",
    skills: { technical: ["Vue", "Python"], soft: ["Accessibility"], credentials: ["Web Accessibility Cert"] },
    metrics: { technicalScore: 75, softScore: 85, credentialScore: 80 },
    scores: { skill: 78, biasOriginal: 65, biasAnonymized: 2, fit: 74 },
    demographics: { gender: "Non-binary", location: "Portland, OR" },
    status: "Pending",
    explanation: "Uses Vue instead of React, strong Python.",
    uploadDate: new Date().toISOString(),
    auditTrail: [{ timestamp: new Date().toISOString(), reviewerId: "SYSTEM", action: "Created", reason: "Automated ingestion" }]
  }
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('fairhire_candidates');
    return saved ? JSON.parse(saved) : demoCandidates;
  });

  const [jobDescription, setJobDescription] = useState(() => {
    const saved = localStorage.getItem('fairhire_jd');
    return saved || defaultJD;
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const logout = async () => {
    await firebaseLogout();
  };

  useEffect(() => {
    localStorage.setItem('fairhire_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('fairhire_jd', jobDescription);
  }, [jobDescription]);

  const addCandidate = (c: Candidate) => setCandidates(prev => [c, ...prev]);
  
  const updateCandidateStatus = (id: string, status: Candidate['status'], reason: string) => 
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          auditTrail: [
            ...c.auditTrail,
            { timestamp: new Date().toISOString(), reviewerId: user?.email || 'Guest', action: `Status Changed: ${status}`, reason }
          ]
        };
      }
      return c;
    }));

  const clearCandidates = () => setCandidates([]);

  return (
    <AppContext.Provider value={{
      candidates,
      jobDescription,
      setJobDescription,
      addCandidate,
      updateCandidateStatus,
      clearCandidates,
      user,
      login,
      logout,
      authLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
