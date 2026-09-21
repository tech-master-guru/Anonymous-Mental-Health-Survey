import { Contract, ledger, type Ledger, type Witnesses } from "../../managed/contract/index.js";

export const CONTRACT_ADDRESS = "0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897";

export const getProofServerUrl = (): string => {
  return "http://localhost:6300";
};

export const NETWORK_CONFIG = {
  networkId: "preview",
  indexerUrl: "https://indexer.preview.midnight.network/api/v4/graphql",
  proofServerUrl: getProofServerUrl(),
  nodeUrl: "https://rpc.preview.midnight.network",
  faucetUrl: "https://faucet.preview.midnight.network",
  explorerUrl: "https://preview.midnightexplorer.com/contracts/" + CONTRACT_ADDRESS,
};

export interface SurveyParticipantPrivateState {
  participantSecretKey: Uint8Array;
  surveyProofNonce: Uint8Array;
  surveyResponseDataHash: Uint8Array;
  assessmentScoreValue: bigint;
  surveyorSigningKey: Uint8Array;
}

export function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function stringToBytes32(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = new Uint8Array(32);
  const encoded = encoder.encode(str);
  bytes.set(encoded.subarray(0, 32));
  return bytes;
}

export function sha256Hex(input: string): string {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h0 = Math.imul(h0 ^ code, 0x5bd1e995);
    h1 = Math.imul(h1 ^ (code << 1), 0x1b873593);
    h2 = Math.imul(h2 ^ (code << 2), 0x2c1b3c6d);
    h3 = Math.imul(h3 ^ (code << 3), 0x85ebca6b);
    h4 = Math.imul(h4 ^ code, 0xc2b2ae35);
    h5 = Math.imul(h5 ^ (code << 1), 0x7feb352d);
    h6 = Math.imul(h6 ^ (code << 2), 0x846ca68b);
    h7 = Math.imul(h7 ^ (code << 3), 0x47b54817);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return "0x" + hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

export class AnonymousMentalHealthSurveyIntegrationClient {
  private contractAddress: string;
  private currentParticipantKey: Uint8Array = new Uint8Array(32);
  private currentResponseHash: Uint8Array = new Uint8Array(32);
  private currentScoreValue: bigint = 15n;
  private currentSurveyorKey: Uint8Array = new Uint8Array(32);

  constructor(address: string = CONTRACT_ADDRESS) {
    this.contractAddress = address;
  }

  public setParticipantSecretKey(key: string): void { this.currentParticipantKey = stringToBytes32(key); }
  public setSurveyResponseDataHash(hash: string): void { this.currentResponseHash = stringToBytes32(hash); }
  public setAssessmentScoreValue(score: number | bigint): void { this.currentScoreValue = BigInt(score); }
  public setSurveyorSigningKey(key: string): void { this.currentSurveyorKey = stringToBytes32(key); }

  // Aliases
  public setProductSecretKey(k: string) { this.setParticipantSecretKey(k); }
  public setPurchaseInvoiceHash(h: string) { this.setSurveyResponseDataHash(h); }
  public setWarrantyDaysRemaining(d: number | bigint) { this.setAssessmentScoreValue(d); }
  public setManufacturerSigningKey(k: string) { this.setSurveyorSigningKey(k); }

  public getWitnesses(): Witnesses<SurveyParticipantPrivateState> {
    return {
      participantSecretKey: (ctx) => [ctx.privateState, this.currentParticipantKey],
      surveyProofNonce: (ctx) => {
        const nonce = new Uint8Array(32);
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
          crypto.getRandomValues(nonce);
        } else {
          nonce.set(stringToBytes32("nonce::" + Date.now()));
        }
        return [ctx.privateState, nonce];
      },
      surveyResponseDataHash: (ctx) => [ctx.privateState, this.currentResponseHash],
      assessmentScoreValue: (ctx) => [ctx.privateState, this.currentScoreValue],
      surveyorSigningKey: (ctx) => [ctx.privateState, this.currentSurveyorKey],
      // Aliases
      productSecretKey: (ctx) => [ctx.privateState, this.currentParticipantKey],
      warrantyProofNonce: (ctx) => {
        const nonce = new Uint8Array(32);
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
          crypto.getRandomValues(nonce);
        } else {
          nonce.set(stringToBytes32("nonce::" + Date.now()));
        }
        return [ctx.privateState, nonce];
      },
      purchaseInvoiceHash: (ctx) => [ctx, this.currentResponseHash],
      warrantyDaysRemaining: (ctx) => [ctx, this.currentScoreValue],
      manufacturerSigningKey: (ctx) => [ctx, this.currentSurveyorKey],
    };
  }

  public async fetchPublicState(): Promise<any> {
    const cleanAddress = this.contractAddress.toLowerCase();
    const query = `
      query ContractState($address: String!) {
        contract(address: $address) {
          address
          state
        }
      }
    `;

    const res = await fetch(NETWORK_CONFIG.indexerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { address: cleanAddress } }),
    });

    if (!res.ok) {
      throw new Error("Midnight indexer error: " + res.status + " " + res.statusText);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error("GraphQL query error: " + json.errors.map((e: any) => e.message).join(", "));
    }

    if (!json?.data?.contract?.state) {
      throw new Error("Contract " + this.contractAddress + " state not found on Midnight Preview indexer.");
    }

    const parsedLedger = ledger(json.data.contract.state);
    return {
      submissionCount: Number(parsedLedger.submissionCount || 0n),
      claimCount: Number(parsedLedger.submissionCount || 0n),
      revokedCount: Number(parsedLedger.revokedCount || 0n),
      activeSession: Number(parsedLedger.activeSession || 0n),
      cohortId: bytesToHex(parsedLedger.cohortId || parsedLedger.productId || new Uint8Array(32)),
      productId: bytesToHex(parsedLedger.cohortId || parsedLedger.productId || new Uint8Array(32)),
      surveyorCommitment: bytesToHex(parsedLedger.surveyorCommitment || parsedLedger.manufacturerCommitment || new Uint8Array(32)),
      manufacturerCommitment: bytesToHex(parsedLedger.surveyorCommitment || parsedLedger.manufacturerCommitment || new Uint8Array(32)),
      lastSubmissionCommitment: bytesToHex(parsedLedger.lastSubmissionCommitment || parsedLedger.lastClaimCommitment || new Uint8Array(32)),
      lastClaimCommitment: bytesToHex(parsedLedger.lastSubmissionCommitment || parsedLedger.lastClaimCommitment || new Uint8Array(32)),
      lastRevokedCommitment: bytesToHex(parsedLedger.lastRevokedCommitment || new Uint8Array(32)),
      scoreThresholdLimit: Number(parsedLedger.scoreThresholdLimit || 10n),
      minimumRequiredDays: Number(parsedLedger.scoreThresholdLimit || 10n),
    };
  }
}

export const ConfidentialProductWarrantyIntegrationClient = AnonymousMentalHealthSurveyIntegrationClient;
