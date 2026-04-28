import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export const isGeminiConfigured = () => {
    try {
        getAI();
        return true;
    } catch {
        return false;
    }
}

export async function processResumePipeline(resumeText: string, jdText: string) {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `
You are the FairHire Engine AI. Your task is to process a candidate's resume against a job description.
Follow these steps carefully:

1. Identify Demographics: Extract apparent gender and location from the original resume.
2. Client-Side Simulation: Assume the resume has been anonymized. Strip names, gender, age, addresses, photo references, graduation years, and any PII. Output this as anonymizedText.
3. Extract skills: Identify technical skills, soft skills, and credentials/certifications from the anonymized resume.
4. Score the candidate based strictly on the 3-score system:
   - Technical Score (0-100): Matches for hard skills.
   - Soft Score (0-100): Matches for soft skills and leadership.
   - Credential Score (0-100): Matches for education and certifications.
   -> Compute the FINAL Skill Score as exactly: (Technical * 0.60) + (Soft * 0.25) + (Credential * 0.15).
5. Counterfactual Bias Test Calculation:
   - Simulate an evaluation of this resume assuming traditional demographic signals.
   - Then simulate a counterfactual run by swapping the demographic signals (e.g., gender, race proxies, age proxies).
   - "Bias Original" should represent the variance percentage between these two divergent demographic runs. If the variance is > 5%, it's considered flagged.
   - "Bias Anonymized" should represent the variance when evaluating solely the anonymizedText (should be 0 or very low, 1-3%).
6. Provide a brief explanation of the SHAP-like feature breakdown for the decision.

Job Description:
${jdText}

Original Resume:
${resumeText}
`,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          anonymizedText: {
            type: Type.STRING,
            description: "The fully anonymized resume text.",
          },
          demographics: {
            type: Type.OBJECT,
            properties: {
              gender: { type: Type.STRING, description: "Apparent gender (e.g., Male, Female, Unknown)" },
              location: { type: Type.STRING, description: "Candidate location" }
            }
          },
          skills: {
            type: Type.OBJECT,
            properties: {
              technical: { type: Type.ARRAY, items: { type: Type.STRING } },
              soft: { type: Type.ARRAY, items: { type: Type.STRING } },
              credentials: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          metrics: {
            type: Type.OBJECT,
            properties: {
              technicalScore: { type: Type.INTEGER },
              softScore: { type: Type.INTEGER },
              credentialScore: { type: Type.INTEGER },
            }
          },
          scores: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.INTEGER, description: "Must be exactly: (technicalScore * 0.6) + (softScore * 0.25) + (credentialScore * 0.15)" },
              biasOriginal: { type: Type.INTEGER, description: "Simulated bias variance % on original demographics." },
              biasAnonymized: { type: Type.INTEGER },
              fit: { type: Type.INTEGER },
            },
          },
          explanation: {
            type: Type.STRING,
            description: "Explain the scores using SHAP-proxy feature breakdown.",
          },
        },
        required: ["anonymizedText", "demographics", "skills", "metrics", "scores", "explanation"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

export async function scanJobDescription(jdText: string) {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `
You are the FairHire Engine AI. Your task is to scan a Job Description for biased, exclusionary, or coded language.
Look specifically for terms including but not limited to: "aggressive", "dominant", "culture fit", "young", "digital native", "ninja", "rockstar", and highly gendered terms.

Job Description:
${jdText}
`,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          flaggedPhrases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phrase: { type: Type.STRING },
                reason: { type: Type.STRING, description: "Why this phrase is exclusionary or biased." },
                suggestion: { type: Type.STRING, description: "A neutral, inclusive rewrite suggestion." },
              },
              required: ["phrase", "reason", "suggestion"],
            },
          },
          overallBiasScore: {
            type: Type.INTEGER,
            description: "0-100 indicating the level of bias in the JD (0 is unbiased, 100 is highly biased)",
          },
          cleanJD: {
            type: Type.STRING,
            description: "A rewritten, unbiased version of the job description.",
          },
        },
        required: ["flaggedPhrases", "overallBiasScore", "cleanJD"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}
