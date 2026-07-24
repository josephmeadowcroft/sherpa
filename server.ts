import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with increased limit for CV file uploads
app.use(express.json({ limit: "15mb" }));

// Helper to strip markdown JSON blocks safely
function cleanJsonText(rawText: string): string {
  let text = rawText.trim();
  if (text.startsWith("```json")) {
    text = text.substring(7);
  } else if (text.startsWith("```")) {
    text = text.substring(3);
  }
  if (text.endsWith("```")) {
    text = text.substring(0, text.length - 3);
  }
  return text.trim();
}

// Get Gemini instance
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API 1: Sherpa Assistant Chat
app.post("/api/assistant", async (req, res) => {
  try {
    const { messages, userProfile, applications = [], latestCvScore } = req.body;
    const ai = getGeminiClient();

    const targetRolesText = userProfile?.targetRoles?.join(", ") || "Software Engineering, Product Management, Finance";
    const appCount = applications.length;
    const appliedCount = applications.filter((a: any) => a.status === "Applied").length;
    const interviewCount = applications.filter((a: any) => a.status === "Interview" || a.status === "Offer").length;

    const systemInstruction = `You are Sherpa, an expert, encouraging, and highly specific career guide for university students.
Your mission is to guide students on exact actionable steps to advance their career, land internships, and upgrade their CV.

Student Context:
- Name: ${userProfile?.displayName || userProfile?.username || "Student"}
- University/Course: ${userProfile?.university || "University"} (${userProfile?.course || "Degree"}), Graduating: ${userProfile?.gradYear || "2026"}
- Target Roles/Industries: ${targetRolesText}
- CV Status: ${latestCvScore !== null && latestCvScore !== undefined ? `Score is ${latestCvScore}/100` : "No CV analyzed yet"}
- Applications Tracked: ${appCount} total (${appliedCount} applied, ${interviewCount} interview/offer)
- CV Excerpt: ${userProfile?.cvText ? userProfile.cvText.slice(0, 1200) : "Not uploaded yet"}

Guidelines:
- Give concise, direct, practical advice formatted neatly with bullet points or bold text.
- Be supportive, knowledgeable about student recruitment processes (Spring Weeks, Internships, Grad Schemes, Networking, Technical Prep).
- Keep answers under 250 words unless detailed resume rewrites or interview preparation is explicitly requested.`;

    // Map message history to Gemini content
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello Sherpa! How can you help me today with my career goals?" }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "I'm here to help guide your career journey. What specific area would you like to tackle today?";
    res.json({ reply });
  } catch (error: any) {
    console.error("Error in /api/assistant:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

// API 2: Next Step Generator
app.post("/api/next-step", async (req, res) => {
  try {
    const { userProfile, applications = [], latestCvScore } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analyze this student profile and activity, then provide ONE clear, high-priority, actionable Next Step for their career progression.

Student Profile:
- Degree & Uni: ${userProfile?.course || "Degree"} at ${userProfile?.university || "University"} (Grad Year: ${userProfile?.gradYear || "2026"})
- Target Roles: ${userProfile?.targetRoles?.join(", ") || "Technology & Business"}
- CV Score: ${latestCvScore !== null && latestCvScore !== undefined ? `${latestCvScore}/100` : "Not uploaded / analyzed"}
- Has Uploaded CV: ${Boolean(userProfile?.cvText)}
- Total Applications: ${applications.length} (${applications.filter((a: any) => a.status === "Applied").length} applied)

Requirements:
- Identify the single most important bottleneck or opportunity right now.
- If CV score < 75 or no CV uploaded, prioritize fixing/uploading CV with deep-link "/cv".
- If CV is strong (>75) but 0 or few applications made, prioritize finding and applying to internships with deep-link "/tracker".
- If user has active applications, suggest interview prep or cold outreach.

Output strictly valid JSON matching this exact structure:
{
  "nextStep": "A concise actionable headline (e.g., 'Upgrade your experience section bullet points')",
  "reason": "A 1-2 sentence explanation of why this is critical right now.",
  "ctaLabel": "Action button text (e.g., 'Optimize CV Now' or 'Browse 12+ Open Internships')",
  "ctaLink": "/cv" | "/tracker" | null
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });

    const cleaned = cleanJsonText(response.text || "");
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/next-step:", error);
    // Fallback recommendation
    res.json({
      nextStep: "Upload your CV to unlock personalized career guidance",
      reason: "Having a analyzed resume allows Sherpa to tailor internship recommendations and bullet point improvements.",
      ctaLabel: "Go to CV Improver",
      ctaLink: "/cv"
    });
  }
});

// API 3: CV / Resume Analysis
app.post("/api/analyze-cv", async (req, res) => {
  try {
    const { fileData, mimeType = "application/pdf", cvText, userId } = req.body;
    const ai = getGeminiClient();

    const promptInstructions = `You are a world-class career coach and tech/finance recruiter.
Evaluate this student's CV/Resume in detail.

Your response MUST be strict JSON formatted as:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "impact": number (0-100),
    "clarity": number (0-100),
    "formatting": number (0-100),
    "relevance": number (0-100),
    "keywords": number (0-100)
  },
  "summary": "Two-sentence overall assessment highlighting main strength and main gap.",
  "tips": [
    {
      "severity": "high" | "medium" | "low",
      "section": "e.g. Experience / Projects / Education / Skills",
      "issue": "Specific weakness identified in the bullet point or layout",
      "fix": "Actionable instructions on how to fix it",
      "example": "A concrete rewritten bullet point using action verbs and metric impact"
    }
  ],
  "improvedSections": [
    {
      "section": "Work Experience / Key Bullet",
      "original": "Original weak statement",
      "improved": "Strong rewritten version with STAR method and quantifiers"
    }
  ],
  "extractedText": "Complete plain text extracted from the document"
}

Provide at least 4-6 detailed actionable tips with concrete rewritten examples!`;

    let contents: any[] = [];

    if (fileData) {
      // Clean base64 string if data URL prefix exists
      const base64Clean = fileData.includes(",") ? fileData.split(",")[1] : fileData;
      contents = [
        {
          inlineData: {
            mimeType: mimeType || "application/pdf",
            data: base64Clean,
          }
        },
        { text: promptInstructions }
      ];
    } else if (cvText) {
      contents = [
        { text: `Resume Content:\n${cvText}\n\n${promptInstructions}` }
      ];
    } else {
      return res.status(400).json({ error: "Either fileData or cvText is required for analysis." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const cleaned = cleanJsonText(response.text || "");
    const analysis = JSON.parse(cleaned);

    res.json(analysis);
  } catch (error: any) {
    console.error("Error in /api/analyze-cv:", error);
    res.status(500).json({ error: error.message || "Failed to analyze CV. Please try uploading a valid PDF document." });
  }
});

// API 4: Fetch Internships with Search Grounding
app.post("/api/fetch-internships", async (req, res) => {
  try {
    const { targetIndustry = "Technology & Software", country = "UK & Global" } = req.body;
    const ai = getGeminiClient();

    const prompt = `Search the web for current, active student internships, spring weeks, and graduate programs for ${targetIndustry} in ${country}.
Look up real positions for university students.

Return a JSON array of 10-12 current open listings with this exact schema for each item:
[
  {
    "id": "unique-slug-string",
    "company": "Company Name",
    "role": "Role Title (e.g. Software Engineering Intern 2026)",
    "industry": "Tech" | "Banking & Finance" | "Consulting" | "Law" | "Marketing" | "Engineering",
    "location": "City, Country or Remote",
    "deadline": "e.g. 15 Aug 2026, Rolling, or Open",
    "applyUrl": "Real application URL or company career page URL"
  }
]

Ensure output is valid JSON array only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });

    const cleaned = cleanJsonText(response.text || "");
    let listings: any[] = [];
    try {
      const parsed: any = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        listings = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (parsed.internships && Array.isArray(parsed.internships)) {
          listings = parsed.internships;
        } else if (parsed.listings && Array.isArray(parsed.listings)) {
          listings = parsed.listings;
        }
      }
    } catch (parseErr) {
      console.warn("JSON parse retry for search grounding output:", parseErr);
      // Fallback structured data if Google search grounding returned text
      listings = [
        {
          id: "google-step-2026",
          company: "Google",
          role: "STEP Internship 2026 (Software Engineering)",
          industry: "Tech",
          location: "London, UK / Munich / Remote",
          deadline: "Rolling",
          applyUrl: "https://careers.google.com/students/"
        },
        {
          id: "jpmorgan-spring-2026",
          company: "J.P. Morgan",
          role: "Software Engineer Spring Week 2026",
          industry: "Banking & Finance",
          location: "London, UK",
          deadline: "15 Oct 2026",
          applyUrl: "https://careers.jpmorgan.com/students"
        },
        {
          id: "palantir-path-2026",
          company: "Palantir",
          role: "Forward Deployed Software Engineer Intern",
          industry: "Tech",
          location: "London, UK",
          deadline: "Rolling",
          applyUrl: "https://www.palantir.com/careers/early-talent/"
        },
        {
          id: "goldman-summer-2026",
          company: "Goldman Sachs",
          role: "Engineering Summer Analyst 2026",
          industry: "Banking & Finance",
          location: "London, UK / New York",
          deadline: "30 Nov 2026",
          applyUrl: "https://www.goldmansachs.com/careers/students/"
        },
        {
          id: "mckinsey-intern-2026",
          company: "McKinsey & Company",
          role: "Business Analyst Intern 2026",
          industry: "Consulting",
          location: "Global Locations",
          deadline: "Rolling",
          applyUrl: "https://www.mckinsey.com/careers/students"
        }
      ];
    }

    res.json({ listings });
  } catch (error: any) {
    console.error("Error in /api/fetch-internships:", error);
    res.status(500).json({ error: error.message || "Failed to search internship listings." });
  }
});

// Vite Middleware & Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sherpa Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
