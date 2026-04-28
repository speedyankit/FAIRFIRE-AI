import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
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
1. Anonymize the resume: Strip names, gender, age, addresses, photo references, graduation years, and any PII. Replace them with placeholders like [REDACTED NAME], [REDACTED DATE], etc.
2. Extract skills: Identify technical skills, soft skills, and credential skills from the anonymized resume.
3. Score the candidate:
   - Skill Score (0-100): How well do the extracted skills match the job description? (technical heavily weighted)
   - Bias Original (0-100): Estimate how biased a traditional ATS might be given the original resume's demographic signals (higher is more biased).
   - Bias Anonymized (0-100): Estimate bias for the anonymized version (should be very low).
   - Fit Score (0-100): Overall fit for the role.
4. Provide a brief explanation for the scores using top 5 features driving the decision.

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
          skills: {
            type: Type.OBJECT,
            properties: {
              technical: { type: Type.ARRAY, items: { type: Type.STRING } },
              soft: { type: Type.ARRAY, items: { type: Type.STRING } },
              credentials: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          scores: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.INTEGER },
              biasOriginal: { type: Type.INTEGER },
              biasAnonymized: { type: Type.INTEGER },
              fit: { type: Type.INTEGER },
            },
          },
          explanation: {
            type: Type.STRING,
            description: "Explain the scores. Provide the top 5 features driving the fit.",
          },
        },
        required: ["anonymizedText", "skills", "scores", "explanation"],
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
You are the FairHire Engine AI. Your task is to scan a Job Description for biased, exclusionary, or coded language (e.g., "ninja", "rockstar", excessive "culture fit", gendered terms).

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
                reason: { type: Type.STRING },
                suggestion: { type: Type.STRING },
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
