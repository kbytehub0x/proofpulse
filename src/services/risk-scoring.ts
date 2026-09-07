interface ExtractedSignal {
  category: "disruption" | "recalls" | "financial" | "legal" | "pricing" | "logistics";
  summary: string;
  source_url: string;
  source_authority: "official" | "government" | "news" | "blog";
  publication_date: string | null;
  severity: number; // 1 to 5
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  disruption: 0.25,
  financial: 0.25,
  legal: 0.20,
  recalls: 0.15,
  logistics: 0.10,
  pricing: 0.05,
};

const AUTHORITY_MULTIPLIERS: Record<string, number> = {
  official: 1.0,
  government: 0.9,
  news: 0.7,
  blog: 0.4,
};

function calculateRecencyWeight(pubDate: string | null): number {
  if (!pubDate) return 0.5;
  const daysOld = Math.max(0, Math.floor((Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60 * 24)));
  if (daysOld <= 7) return 1.0;
  if (daysOld <= 30) return 0.9;
  if (daysOld <= 90) return 0.7;
  if (daysOld <= 365) return 0.5;
  return 0.2;
}

export function computeDeterministicRisk(signals: ExtractedSignal[]) {
  if (signals.length === 0) {
    return {
      riskScore: 5.0,
      riskLevel: "LOW",
      confidence: 90.0,
      breakdown: {},
    };
  }

  const categoryScores: Record<string, { totalWeighted: number; count: number }> = {
    disruption: { totalWeighted: 0, count: 0 },
    recalls: { totalWeighted: 0, count: 0 },
    financial: { totalWeighted: 0, count: 0 },
    legal: { totalWeighted: 0, count: 0 },
    pricing: { totalWeighted: 0, count: 0 },
    logistics: { totalWeighted: 0, count: 0 },
  };

  for (const signal of signals) {
    const cat = signal.category in categoryScores ? signal.category : "disruption";
    const authority = AUTHORITY_MULTIPLIERS[signal.source_authority] || 0.5;
    const recency = calculateRecencyWeight(signal.publication_date);
    const normalizedSeverity = (signal.severity / 5) * 100;

    const weightedSignal = normalizedSeverity * authority * recency;
    categoryScores[cat].totalWeighted += weightedSignal;
    categoryScores[cat].count += 1;
  }

  let finalScore = 0;
  const breakdown: Record<string, { points: number; signalCount: number }> = {};

  for (const [cat, data] of Object.entries(categoryScores)) {
    const weight = CATEGORY_WEIGHTS[cat] || 0.1;
    const avgScore = data.count > 0 ? Math.min(100, data.totalWeighted / data.count) : 0;
    const contributedPoints = Math.round(avgScore * weight * 10) / 10;

    finalScore += contributedPoints;
    breakdown[cat] = {
      points: contributedPoints,
      signalCount: data.count,
    };
  }

  const boundedScore = Math.min(100, Math.max(0, Math.round(finalScore)));

  let riskLevel = "LOW";
  if (boundedScore > 75) riskLevel = "CRITICAL";
  else if (boundedScore > 50) riskLevel = "HIGH";
  else if (boundedScore > 25) riskLevel = "MEDIUM";

  const confidence = Math.min(95, 60 + signals.length * 5);

  return {
    riskScore: boundedScore,
    riskLevel,
    confidence,
    breakdown,
  };
}
