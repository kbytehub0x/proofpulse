import { NextResponse } from "next/server";
import { AnalysisRequestSchema } from "@/lib/schemas";
import { db } from "@/db/connection";
import { executeAnalysisPipeline } from "@/services/orchestrator";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = AnalysisRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const analysisId = `an_${crypto.randomUUID()}`;

    // Write initial record
    const stmt = db.prepare(`
      INSERT INTO analyses (
        id, supplier, product, amount, country, route, material, deadline, status, current_step
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 'Analysis queued')
    `);

    stmt.run(
      analysisId,
      parsed.data.supplier,
      parsed.data.product,
      parsed.data.amount,
      parsed.data.country || null,
      parsed.data.route || null,
      parsed.data.material || null,
      parsed.data.deadline || null
    );

    // Asynchronous dispatch (non-blocking)
    setImmediate(() => {
      executeAnalysisPipeline(analysisId, parsed.data).catch((err) => {
        console.error(`Pipeline failure for ${analysisId}:`, err);
        db.prepare(`
          UPDATE analyses 
          SET status = 'error', error_message = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(err.message, analysisId);
      });
    });

    return NextResponse.json({
      analysisId,
      status: "queued",
      estimatedDurationSeconds: 25,
    }, { status: 202 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
