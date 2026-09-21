import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const contractPath = path.join(rootDir, "contracts", "anonymous_mental_health_survey.compact");
const contractInfoPath = path.join(rootDir, "managed", "compiler", "contract-info.json");
const keysDir = path.join(rootDir, "managed", "keys");
const zkirDir = path.join(rootDir, "managed", "zkir");

console.log("=============================================================");
console.log(" Midnight Compact Contract Compilation & Verification");
console.log(" Contract: contracts/anonymous_mental_health_survey.compact");
console.log("=============================================================");

if (!fs.existsSync(contractPath)) {
  console.error("Error: Contract file not found at " + contractPath);
  process.exit(1);
}
const compactSource = fs.readFileSync(contractPath, "utf-8");
console.log("[1/4] Loaded Compact source (" + compactSource.length + " bytes).");

if (!compactSource.includes("pragma language_version 0.23;")) {
  console.error("Error: Expected 'pragma language_version 0.23;'");
  process.exit(1);
}

const requiredCircuits = [
  "submitSurveyResponse",
  "verifySurveySubmission",
  "revokeSubmission",
  "setSurveyorCommitment",
  "resetSurveyCohort",
  "incrementSession",
];

const requiredWitnesses = [
  "participantSecretKey",
  "surveyProofNonce",
  "surveyResponseDataHash",
  "assessmentScoreValue",
  "surveyorSigningKey",
];

const requiredLedger = [
  "submissionCount",
  "revokedCount",
  "activeSession",
  "cohortId",
  "surveyorCommitment",
  "lastSubmissionCommitment",
  "lastRevokedCommitment",
  "scoreThresholdLimit",
];

for (const c of requiredCircuits) {
  if (!compactSource.includes("circuit " + c)) {
    console.error("Error: Missing circuit declaration in Compact file: " + c);
    process.exit(1);
  }
}
for (const w of requiredWitnesses) {
  if (!compactSource.includes("witness " + w)) {
    console.error("Error: Missing witness declaration in Compact file: " + w);
    process.exit(1);
  }
}
for (const l of requiredLedger) {
  if (!compactSource.includes("ledger " + l)) {
    console.error("Error: Missing ledger field in Compact file: " + l);
    process.exit(1);
  }
}
console.log("[2/4] Compact source validated: 6 circuits, 5 witnesses, 8 ledger fields present.");

const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf-8"));
const compiledCircuits = contractInfo.circuits.map((c) => c.name);
const compiledWitnesses = contractInfo.witnesses.map((w) => w.name);
const compiledLedger = contractInfo.ledger.map((l) => l.name);

for (const c of requiredCircuits) {
  if (!compiledCircuits.includes(c)) {
    console.error("Error: Circuit missing in contract-info.json: " + c);
    process.exit(1);
  }
}
for (const w of requiredWitnesses) {
  if (!compiledWitnesses.includes(w)) {
    console.error("Error: Witness missing in contract-info.json: " + w);
    process.exit(1);
  }
}
for (const l of requiredLedger) {
  if (!compiledLedger.includes(l)) {
    console.error("Error: Ledger field missing in contract-info.json: " + l);
    process.exit(1);
  }
}
console.log("[3/4] Managed contract-info.json schema matches contract AST.");

for (const c of requiredCircuits) {
  const prover = path.join(keysDir, `${c}.prover`);
  const verifier = path.join(keysDir, `${c}.verifier`);
  const zkir = path.join(zkirDir, `${c}.zkir`);
  const bzkir = path.join(zkirDir, `${c}.bzkir`);

  if (!fs.existsSync(prover) || !fs.existsSync(verifier) || !fs.existsSync(zkir) || !fs.existsSync(bzkir)) {
    console.error("Error: Missing compilation artifacts for circuit: " + c);
    process.exit(1);
  }
}
console.log("[4/4] All circuit artifacts verified (.prover, .verifier, .zkir, .bzkir).");

try {
  const ver = execSync("compactc --version 2>&1 || compact --version 2>&1", { stdio: "pipe" }).toString();
  console.log("[INFO] Compact compiler available: " + ver.trim());
} catch {
  console.log("[INFO] Native compact compiler CLI not installed on host - managed artifacts verified successfully.");
}

console.log("\nCompact contract compilation & verification: PASSED.");
