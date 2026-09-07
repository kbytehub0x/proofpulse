import OpenAI from "openai";

// Initialize OpenAI client pointing to Nebius Token Factory
export const nebius = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY || "",
  baseURL: process.env.NEBIUS_BASE_URL || "https://api.studio.nebius.ai/v1",
});

// Configurable model IDs from environment variables
const EXTRACTION_MODEL = process.env.NEMOTRON_EXTRACTION_MODEL || "nvidia/nemotron-3-nano";
const SYNTHESIS_MODEL = process.env.NEMOTRON_SYNTHESIS_MODEL || "nvidia/nemotron-3-ultra";

export interface ExtractedSignal {
  category: "disruption" | "recalls" | "financial" | "legal" | "pricing" | "logistics";
  summary: string;
  source_url: string;
  source_authority: "official" | "government" | "news" | "blog";
  publication_date: string | null;
  severity: number; // 1 to 5
}

export interface ExtractionResult {
  signals: ExtractedSignal[];
  gaps?: string[];
  confidence?: number;
}

/**
 * Step 1: Single-Pass Fact Extraction (Nemotron Fast / Nano)
 */
export async function extractEvidenceSinglePass(deduplicatedContext: string): Promise<ExtractionResult> {
  const prompt = `You are a certified supply chain intelligence auditor.
Analyze the following deduplicated search results and extract verifiable risk signals.
Format your output strictly as a valid JSON object matching this schema:
{
  "signals": [
    {
      "category": "disruption" | "recalls" | "financial" | "legal" | "pricing" | "logistics",
      "summary": "Factual 1-2 sentence statement of event/issue without speculation",
      "source_url": "Source URL exactly as provided in the context",
      "source_authority": "official" | "government" | "news" | "blog",
      "publication_date": "YYYY-MM-DD or null",
      "severity": 1 to 5
    }
  ],
  "gaps": ["Missing data points"],
  "confidence": 0 to 100
}

Context to evaluate:
${deduplicatedContext}`;

  try {
    const response = await nebius.chat.completions.create({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: "You extract supply chain signals strictly into JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{"signals":[]}';
    return JSON.parse(content) as ExtractionResult;
  } catch (error: any) {
    console.error("Nemotron extraction failed:", error.message);
    return { signals: [], gaps: ["Extraction service error"], confidence: 0 };
  }
}

/**
 * Step 2: Final Strategic Synthesis (Nemotron 3 Ultra)
 */
export async function synthesizeDecision(params: {
  supplier: string;
  product: string;
  amount: number;
  deadline?: string;
  riskScore: number;
  riskLevel: string;
  signals: ExtractedSignal[];
}) {
  const prompt = `You are an executive procurement director evaluating order exposure.
Input Parameters:
- Supplier: ${params.supplier}
- Product: ${params.product}
- Order Exposure: $${params.amount.toLocaleString()}
- Delivery Deadline: ${params.deadline || "Not specified"}
- Deterministic Risk Score: ${params.riskScore}/100 (${params.riskLevel})
- Extracted Evidence: ${JSON.stringify(params.signals)}

Select exactly ONE directive: "BUY_NOW", "HOLD", "SPLIT", or "SWITCH".
Provide structured reasoning and operational trade-offs.

Respond ONLY with valid JSON matching this schema:
{
  "recommendation": "BUY_NOW" | "HOLD" | "SPLIT" | "SWITCH",
  "reasoning": "Detailed executive justification balancing cost vs disruption risks",
  "cost_benefit": {
    "upside": "Projected financial savings or supply preservation",
    "downside_risk": "Worst-case financial or operational impact"
  },
  "monitoring_checklist": ["Signal to monitor", "Audit task to execute"],
  "brief_markdown": "# Executive Risk Assessment\\n\\n..."
}`;

  try {
    const response = await nebius.chat.completions.create({
      model: SYNTHESIS_MODEL,
      messages: [
        { role: "system", content: "You provide executive procurement directives strictly in JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Nemotron synthesis failed:", error.message);
    return {
      recommendation: "HOLD",
      reasoning: "Automated synthesis failed; manual review required.",
      cost_benefit: { upside: "$0", downside_risk: "Unknown" },
      monitoring_checklist: ["Conduct manual vendor review"],
      brief_markdown: "# Assessment Error\n\nUnable to complete automated synthesis.",
    };
  }
}
