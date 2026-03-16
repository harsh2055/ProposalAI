/**
 * AI Service — Groq API (llama-3.3-70b-versatile)
 * Free tier: 14,400 req/day, 6,000 tokens/min
 * Get key: https://console.groq.com/keys
 */

let _groq = null;

function getClient() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys");
    }
    const Groq = require("groq-sdk");
    _groq = new Groq({ apiKey: key });
  }
  return _groq;
}

const TEMPLATE_CONTEXTS = {
  WEB_DEVELOPMENT: "Focus on modern web technologies, responsive design, SEO, performance optimization, and browser compatibility. Include backend and frontend development phases.",
  MOBILE_APP: "Focus on mobile-first design, cross-platform compatibility (iOS/Android), app store submission, and UX best practices. Include testing and maintenance phases.",
  MARKETING_CAMPAIGN: "Focus on brand strategy, target audience analysis, content creation, social media, analytics, and measurable KPIs.",
  SAAS_DEVELOPMENT: "Focus on scalable architecture, API design, subscription models, security, cloud infrastructure, and ongoing development roadmap.",
  UI_UX_DESIGN: "Focus on user research, wireframing, prototyping, design systems, usability testing, and design handoff documentation.",
  CUSTOM: "Adapt the proposal structure to the specific project requirements.",
};

function buildPrompt({ clientName, company, projectDescription, projectType,
  timeline, estimatedBudget, additionalNotes, template }) {
  const context = TEMPLATE_CONTEXTS[template] || TEMPLATE_CONTEXTS.CUSTOM;
  return `You are a professional business consultant and proposal writer with 15+ years of experience.
Create a complete business proposal for the following project.

CLIENT: ${clientName}
COMPANY: ${company || "N/A"}
PROJECT TYPE: ${projectType || "General"}
PROJECT DESCRIPTION: ${projectDescription}
TIMELINE: ${timeline || "To be discussed"}
BUDGET: ${estimatedBudget || "To be discussed"}
${additionalNotes ? `ADDITIONAL CONTEXT: ${additionalNotes}` : ""}
TEMPLATE FOCUS: ${context}

CRITICAL RULES:
- Return ONLY a valid JSON object
- Every value MUST be a plain string (no nested objects, no arrays)
- Write each section as flowing paragraphs of plain text
- Do NOT use sub-keys, phases, or nested structures

Required JSON structure (all values must be plain strings):
{
  "projectOverview": "Write 3-4 paragraphs of plain text introducing the project, client challenges, and goals.",
  "scopeOfWork": "Write a plain text description of all work phases and tasks as paragraphs.",
  "deliverables": "Write a plain text numbered list: 1. Deliverable one. 2. Deliverable two. etc.",
  "timeline": "Write a plain text phase-by-phase schedule with milestones as paragraphs.",
  "pricing": "Write a plain text pricing breakdown with total investment clearly stated.",
  "terms": "Write plain text covering payment terms, revisions, IP rights, and confidentiality.",
  "closingStatement": "Write 1-2 paragraphs with value summary and call to action."
}`;
}

/**
 * Convert any value to a plain string.
 * Handles the case where the LLM returns nested objects/arrays instead of strings.
 */
function toPlainString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;

  // It's an object or array — flatten it to readable text
  if (typeof value === "object") {
    const lines = [];

    function extract(obj, depth = 0) {
      if (typeof obj === "string") {
        lines.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          if (typeof item === "string") {
            lines.push(`${i + 1}. ${item}`);
          } else if (typeof item === "object" && item !== null) {
            extract(item, depth + 1);
          }
        });
      } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach((v) => extract(v, depth + 1));
      }
    }

    extract(value);
    return lines.join("\n\n");
  }

  return String(value);
}

function parseResponse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Force every section to a plain string — no matter what the LLM returns
  return {
    projectOverview:  toPlainString(parsed.projectOverview),
    scopeOfWork:      toPlainString(parsed.scopeOfWork),
    deliverables:     toPlainString(parsed.deliverables),
    timeline:         toPlainString(parsed.timeline),
    pricing:          toPlainString(parsed.pricing),
    terms:            toPlainString(parsed.terms),
    closingStatement: toPlainString(parsed.closingStatement),
  };
}

async function generateProposal(inputs) {
  const logger = require("../utils/logger");
  const groq = getClient();

  logger.info(`Groq generating proposal for ${inputs.clientName} at ${inputs.company || "N/A"}`);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a professional business proposal writer. Always respond with valid JSON only. All JSON values must be plain strings — never use nested objects or arrays as values.",
      },
      {
        role: "user",
        content: buildPrompt(inputs),
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("No content returned from Groq");

  const sections = parseResponse(text);
  const tokensUsed = completion.usage?.total_tokens || 0;

  logger.info(`Proposal generated. Tokens used: ${tokensUsed}`);

  return {
    ...sections,
    model: "llama-3.3-70b-versatile",
    tokensUsed,
  };
}

async function improveSection(section, currentContent, context) {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a professional business proposal editor. Return only the improved plain text, no labels, no JSON, no explanation.",
      },
      {
        role: "user",
        content: `Improve this "${section}" section to be more compelling and professional.\nContext: ${context}\n\nCurrent:\n${currentContent}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 800,
  });
  return completion.choices[0]?.message?.content?.trim() || currentContent;
}

module.exports = { generateProposal, improveSection };
