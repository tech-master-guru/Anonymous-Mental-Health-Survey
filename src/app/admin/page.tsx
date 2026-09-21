"use client";
import { useState } from "react";
import { getClient } from "../../lib/contract";
import Link from "next/link";

export default function AdminPage() {
  const [cohortId, setCohortId] = useState("cohort_university_wellness_2027");
  const [resetThreshold, setResetThreshold] = useState(10);
  const [loadingReset, setLoadingReset] = useState(false);

  const [surveyorKey, setSurveyorKey] = useState("");
  const [surveyorThreshold, setSurveyorThreshold] = useState(10);
  const [loadingSurveyor, setLoadingSurveyor] = useState(false);

  const [revokeCommitment, setRevokeCommitment] = useState("");
  const [loadingRevoke, setLoadingRevoke] = useState(false);

  const [loadingSession, setLoadingSession] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const addLog = (msg: string, type = "info") => setLogs(l => [...l, { msg, type }]);
  const isLoading = loadingReset || loadingSurveyor || loadingRevoke || loadingSession;

  const handleSetSurveyor = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingSurveyor(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] surveyorSigningKey() - derived from private key, never disclosed", "info");
      addLog(`> [CIRCUIT] Executing setSurveyorCommitment(Uint<32>) - scoreThreshold=${surveyorThreshold}...`, "info");
      const client = getClient();
      client.setSurveyorSigningKey(surveyorKey || "surveyor_clinical_coordinator_signing_key");
      const res = await client.setSurveyorCommitment(surveyorThreshold);
      setResult({ ...res, circuit: "setSurveyorCommitment(Uint<32>)" });
      addLog("> [SUCCESS] Surveyor authority commitment anchored on-chain!", "success");
      addLog(`> [COMMITMENT] ${res.surveyorCommitment}`, "success");
      addLog(`> [THRESHOLD] Score threshold set to ${res.newThreshold}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingSurveyor(false); }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingRevoke(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] surveyorSigningKey() - ZK authorization proof generated locally", "info");
      addLog(`> [CIRCUIT] Executing revokeSubmission(Bytes<32>) - commitment: ${revokeCommitment.substring(0, 20)}...`, "info");
      const res = await getClient().revokeSubmission(revokeCommitment);
      setResult({ ...res, circuit: "revokeSubmission(Bytes<32>)" });
      addLog("> [SUCCESS] Submission commitment revoked on-chain!", "success");
      addLog(`> [REVOKED] ${res.revokedCommitment}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingRevoke(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingReset(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog(`> [CIRCUIT] Executing resetSurveyCohort("${cohortId}", ${resetThreshold})...`, "info");
      const res = await getClient().resetSurveyCohort(cohortId, resetThreshold);
      setResult({ ...res, circuit: "resetSurveyCohort(Bytes<32>, Uint<32>)" });
      addLog(`> [SUCCESS] Survey cohort updated! New Cohort ID: ${res.newCohortId}`, "success");
      addLog(`> [THRESHOLD] Score threshold updated to ${res.newThreshold}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingReset(false); }
  };

  const handleSession = async () => {
    setLoadingSession(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [CIRCUIT] Executing incrementSession() - monotonic counter bump...", "info");
      const res = await getClient().incrementSession();
      setResult({ ...res, circuit: "incrementSession()" });
      addLog(`> [SUCCESS] Active session counter incremented to ${res.activeSession}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingSession(false); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge badge-amber">Clinical Administrator Authority</span>
          <span className="badge badge-purple">Midnight Preview</span>
        </div>
        <h1 className="section-title">Surveyor Admin Console</h1>
        <p className="section-desc">
          Manage survey cohort parameters, anchor clinical authority commitments, and revoke corrupted submissions via zero-knowledge circuits.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Panel 1: Anchor Authority */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#f59e0b" }}>
            1. Anchor Surveyor Commitment
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
            Anchors surveyor cryptographic authority and configures assessment scoring criteria.
          </p>
          <form onSubmit={handleSetSurveyor} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="password"
              value={surveyorKey}
              onChange={e => setSurveyorKey(e.target.value)}
              className="input-field"
              placeholder="Surveyor Signing Key"
            />
            <input
              type="number"
              value={surveyorThreshold}
              onChange={e => setSurveyorThreshold(Number(e.target.value))}
              className="input-field"
              min={1}
              placeholder="Min Score Threshold"
            />
            <button type="submit" disabled={isLoading} className="btn-secondary">
              {loadingSurveyor ? "Anchoring..." : "Anchor Surveyor Commitment"}
            </button>
          </form>
        </div>

        {/* Panel 2: Revoke Submission */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#ef4444" }}>
            2. Revoke Corrupted Submission
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
            Invalidates a compromised or duplicate survey commitment using the surveyor&apos;s ZK authorization signature.
          </p>
          <form onSubmit={handleRevoke} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="text"
              value={revokeCommitment}
              onChange={e => setRevokeCommitment(e.target.value)}
              className="input-field"
              placeholder="Commitment Hash (0x...)"
              required
            />
            <button type="submit" disabled={isLoading} className="btn-secondary" style={{ color: "#ef4444" }}>
              {loadingRevoke ? "Revoking..." : "Revoke Submission"}
            </button>
          </form>
        </div>

        {/* Panel 3: Reset Cohort */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#10b981" }}>
            3. Reset Survey Cohort
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
            Rotates active survey cohort/session ID and updates assessment threshold.
          </p>
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="text"
              value={cohortId}
              onChange={e => setCohortId(e.target.value)}
              className="input-field"
              placeholder="New Cohort ID"
              required
            />
            <input
              type="number"
              value={resetThreshold}
              onChange={e => setResetThreshold(Number(e.target.value))}
              className="input-field"
              min={1}
            />
            <button type="submit" disabled={isLoading} className="btn-secondary">
              {loadingReset ? "Updating..." : "Update Survey Cohort"}
            </button>
          </form>
        </div>

        {/* Panel 4: Bump Session */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#06b6d4" }}>
            4. Session Replay Protection
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
            Increments the active session counter to prevent cross-epoch replay of survey signatures.
          </p>
          <button onClick={handleSession} disabled={isLoading} className="btn-secondary" style={{ width: "100%", marginTop: "1.5rem" }}>
            {loadingSession ? "Incrementing..." : "Bump Active Session Nonce"}
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            Execution Logs
          </div>
          <div style={{ background: "#050811", borderRadius: "8px", padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem", maxHeight: "200px", overflowY: "auto" }}>
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
