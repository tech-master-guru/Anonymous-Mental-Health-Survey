"use client";
import { useState } from "react";
import { getClient } from "../../lib/contract";
import Link from "next/link";

export default function ClaimPage() {
  const [cohortId, setCohortId] = useState("cohort_university_wellness_2026");
  const [participantKey, setParticipantKey] = useState("");
  const [surveyResponseData, setSurveyResponseData] = useState("");
  const [assessmentScore, setAssessmentScore] = useState(15);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [claimedCommitment, setClaimedCommitment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const MINIMUM_SCORE_THRESHOLD = 1;
  const addLog = (msg: string, type = "info") => setLogs(l => [...l, { msg, type }]);

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null); setLogs([]);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      const client = getClient();
      client.setParticipantSecretKey(participantKey || "participant_seed_secret_key_2026");
      client.setSurveyResponseDataHash(surveyResponseData || "phq9_gad7_assessment_responses_json_hash");
      client.setAssessmentScoreValue(assessmentScore);

      addLog("> [ZK WITNESS] participantSecretKey() - private respondent key generated locally", "info");
      addLog("> [ZK WITNESS] surveyProofNonce() - random entropy salt for replay protection", "info");
      addLog("> [ZK WITNESS] surveyResponseDataHash() - SHA-256 hash of detailed survey answers", "info");
      addLog(`> [ZK WITNESS] assessmentScoreValue() - ${assessmentScore} score vs. minimum threshold >= ${MINIMUM_SCORE_THRESHOLD}`, "info");
      addLog("> [ZK THRESHOLD] Asserting assessmentScoreValue >= scoreThresholdLimit privately...", "info");

      if (assessmentScore < MINIMUM_SCORE_THRESHOLD) {
        addLog(`> [REJECTED] Assessment score ${assessmentScore} is invalid or incomplete`, "error");
        setError(`Invalid Survey: assessment score must be at least ${MINIMUM_SCORE_THRESHOLD}.`);
        return;
      }

      addLog("> [CIRCUIT] Executing submitSurveyResponse(Bytes<32>) on Midnight Network...", "info");
      const res = await client.submitSurveyResponse(cohortId);
      setResult(res);
      addLog(`> [SUCCESS] Anonymous survey response verified & signed! TxHash: ${res.txHash}`, "success");
      addLog(`> [COMMITMENT] ZK Submission Commitment: ${res.commitmentHex}`, "success");
      addLog("> [PRIVACY] Respondent identity, individual answers, diagnosis - NEVER disclosed on-chain", "success");
      addLog(`> [FEE] Transaction fee: ${res.txFee} ${res.txFeeAsset}`, "info");
    } catch (err: any) {
      const msg = err?.message || "Survey response submission failed.";
      setError(msg);
      addLog(`> [ERROR] ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true); setVerifyResult(null);
    try {
      addLog("> [CIRCUIT] Executing verifySurveySubmission(Bytes<32>) on-chain...", "info");
      const res = await getClient().verifySurveySubmission(claimedCommitment);
      setVerifyResult(res);
      addLog(res.matches
        ? "> [VERIFIED] Commitment matches on-chain record - survey response is VALID"
        : "> [MISMATCH] Commitment does NOT match - response may be invalid or revoked",
        res.matches ? "success" : "error");
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message || err}`, "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge badge-cyan">ZK Survey Submission</span>
          <span className="badge badge-purple">Midnight Preview</span>
        </div>
        <h1 className="section-title">Anonymous Mental Health Survey</h1>
        <p className="section-desc">
          Submit confidential mental health assessment evaluations with client-side zero-knowledge proofs. Your personal identity, responses, and score remain 100% private.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#f8fafc" }}>
          Step 1: Submit Anonymous Survey (Private ZK Witness Input)
        </h2>
        <form onSubmit={handleSurveySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
              Survey Cohort / Study Group ID (Public)
            </label>
            <input
              type="text"
              value={cohortId}
              onChange={e => setCohortId(e.target.value)}
              className="input-field"
              placeholder="cohort_university_wellness_2026"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
              Participant Secret Key / Anonymous Identifier (Private Witness - Never Leaves Browser)
            </label>
            <input
              type="password"
              value={participantKey}
              onChange={e => setParticipantKey(e.target.value)}
              className="input-field"
              placeholder="e.g. participant_secret_seed_token_9812"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
              Survey Response Answers Identifier (Private Witness - Hashed locally)
            </label>
            <input
              type="text"
              value={surveyResponseData}
              onChange={e => setSurveyResponseData(e.target.value)}
              className="input-field"
              placeholder="e.g. phq9_response_item_answers_hash_2026"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
              Assessment Score Value (Private Witness: Threshold Assertion &gt;= 1)
            </label>
            <input
              type="number"
              value={assessmentScore}
              onChange={e => setAssessmentScore(Number(e.target.value))}
              className="input-field"
              min={1}
              max={100}
              required
            />
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "0.5rem" }}>
            {loading ? <><span className="spinner" /> Generating ZK Proof & Submitting...</> : "🧠 Submit Anonymous Response"}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: "1.5rem", padding: "1.25rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem" }}>
              Response Submitted & Commitment Anchored On-Chain!
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontFamily: "monospace", wordBreak: "break-all" }}>
              <div><strong>Tx Hash:</strong> {result.txHash}</div>
              <div style={{ marginTop: "0.25rem" }}><strong>ZK Commitment:</strong> {result.commitmentHex}</div>
            </div>
            <button
              onClick={() => setClaimedCommitment(result.commitmentHex)}
              className="btn-secondary"
              style={{ marginTop: "0.75rem", fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
            >
              Use in Verification Below
            </button>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#f8fafc" }}>
          Step 2: Verify Survey Submission On-Chain
        </h2>
        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
              ZK Submission Commitment Hash (Hex)
            </label>
            <input
              type="text"
              value={claimedCommitment}
              onChange={e => setClaimedCommitment(e.target.value)}
              className="input-field"
              placeholder="0x..."
              required
            />
          </div>

          <button type="submit" disabled={verifyLoading} className="btn-secondary">
            {verifyLoading ? "Verifying On-Chain..." : "🔍 Verify Submission Status"}
          </button>
        </form>

        {verifyResult && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: verifyResult.matches ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${verifyResult.matches ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "8px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: verifyResult.matches ? "#10b981" : "#ef4444" }}>
              {verifyResult.matches ? "✅ Survey Submission Verified on Midnight Ledger" : "❌ Commitment Mismatch or Revoked"}
            </div>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            ZK Execution Logs
          </div>
          <div style={{ background: "#050811", borderRadius: "8px", padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem", maxHeight: "220px", overflowY: "auto" }}>
            {logs.map((l, i) => (
              <div key={i} style={{ color: l.type === "error" ? "#ef4444" : l.type === "success" ? "#10b981" : "#94a3b8", marginBottom: "0.25rem" }}>
                {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
