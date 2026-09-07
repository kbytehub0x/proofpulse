export interface TavilyQueryPlan {
  id: string;
  category: "disruption" | "recalls" | "financial" | "legal" | "pricing" | "logistics";
  query: string;
  topic: "general" | "news" | "finance";
  searchDepth: "basic" | "advanced";
  timeRange: "day" | "week" | "month" | "year";
  maxResults: number;
  includeDomains?: string[];
}

export function generateCoreQueries(params: {
  supplier: string;
  product: string;
  country?: string;
  route?: string;
  material?: string;
}): TavilyQueryPlan[] {
  const s = params.supplier.trim();
  const p = params.product.trim();
  const c = params.country ? params.country.trim() : "";
  const r = params.route ? params.route.trim() : "";

  return [
    {
      id: "q1_disruption",
      category: "disruption",
      query: `"${s}" factory closure OR production halt OR supply disruption`,
      topic: "news",
      searchDepth: "advanced",
      timeRange: "month",
      maxResults: 4,
      includeDomains: ["reuters.com", "bloomberg.com", "ft.com", "wsj.com"],
    },
    {
      id: "q2_recalls",
      category: "recalls",
      query: `"${p}" recall OR safety notice OR regulatory suspension`,
      topic: "news",
      searchDepth: "advanced",
      timeRange: "year",
      maxResults: 4,
      includeDomains: ["fda.gov", "cpsc.gov", "ec.europa.eu", "gov.uk"],
    },
    {
      id: "q3_financial",
      category: "financial",
      query: `"${s}" bankruptcy OR debt default OR insolvency OR restructuring`,
      topic: "finance",
      searchDepth: "advanced",
      timeRange: "year",
      maxResults: 4,
      includeDomains: ["sec.gov", "bloomberg.com", "reuters.com", "ft.com"],
    },
    {
      id: "q4_legal",
      category: "legal",
      query: `"${s}" sanctions OR export control OR penalty OR trade enforcement`,
      topic: "general",
      searchDepth: "advanced",
      timeRange: "year",
      maxResults: 4,
      includeDomains: ["justice.gov", "bis.gov", "treasury.gov", "reuters.com"],
    },
    {
      id: "q5_pricing",
      category: "pricing",
      query: `"${p}" component price increase shortage trend 2026`,
      topic: "finance",
      searchDepth: "basic",
      timeRange: "month",
      maxResults: 3,
      includeDomains: ["reuters.com", "bloomberg.com", "tradingeconomics.com"],
    },
    {
      id: "q6_logistics",
      category: "logistics",
      query: r 
        ? `"${r}" port congestion OR shipping delay OR freight disruption`
        : `"${s}" logistics delay OR shipment disruption OR container shortage`,
      topic: "news",
      searchDepth: "advanced",
      timeRange: "month",
      maxResults: 4,
      includeDomains: ["lloydslist.com", "reuters.com", "maritimeintelligence.com"],
    },
  ];
}
