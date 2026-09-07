import { NextResponse } from "next/server";
import { db } from "@/db/connection";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const row: any = db.prepare("SELECT * FROM analyses WHERE id = ?").get(params.id);

  if (!row) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Parse stored JSON blobs for the client
  return NextResponse.json({
    id: row.id,
    supplier: row.supplier,
    product: row.product,
    amount: row.amount,
    status: row.status,
    currentStep: row.current_step,
    progress: {
      totalSearches: row.search_total,
      completedSearches: row.search_completed,
    },
    entity: row.entity_data ? JSON.parse(row.entity_data) : null,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    confidence: row.confidence_score,
    signalBreakdown: row.signal_breakdown ? JSON.parse(row.signal_breakdown) : null,
    evidence: row.evidence_data ? JSON.parse(row.evidence_data) : null,
    decision: row.decision ? {
      recommendation: row.decision,
      reasoning: row.decision_reasoning,
      brief: row.decision_brief,
    } : null,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
}
