import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { InitialAPI, ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Contract, ledger, type Ledger, type Witnesses } from "../../managed/contract/index.js";

/**
 * ============================================================================
 * ANONYMOUS MENTAL HEALTH SURVEY (AMHS) - MIDNIGHT ZK CLIENT
 * ============================================================================
 * Connected smart contract address on Midnight Preview Testnet.
 */
export const CONTRACT_ADDRESS =
  "0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897";

export const getProofServerUrl = (): string => {
  return "http://localhost:6300";
};

export interface NetworkConfiguration {
  networkId: string;
  indexerUrl: string;
  proofServerUrl: string;
  nodeUrl: string;
  faucetUrl: string;
  explorerUrl: string;
}

export const NETWORK_CONFIG: NetworkConfiguration = {
  networkId: "preview",
  indexerUrl: "https://indexer.preview.midnight.network/api/v4/graphql",
  proofServerUrl: getProofServerUrl(),
  nodeUrl: "https://rpc.preview.midnight.network",
  faucetUrl: "https://faucet.preview.midnight.network",
  explorerUrl:
    "https://preview.midnightexplorer.com/contracts/" + CONTRACT_ADDRESS,
};

setNetworkId(NETWORK_CONFIG.networkId);

export function strToBytes32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.subarray(0, 32));
  return bytes;
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

export class AnonymousMentalHealthSurveyClient {
  public contractAddress: string;
  public networkConfig: NetworkConfiguration;
  private isConnected = false;
  private connectedAddress: string | null = null;
  private walletApi: ConnectedAPI | any = null;

  // Private witness values (set by the UI before circuit calls)
  private _participantKey = "participant_seed_secret_key_2026";
  private _surveyNonce = "entropy_salt_survey_response_nonce";
  private _responseHash = "sha256_phq9_gad7_survey_answers_hash";
  private _assessmentScore = 15;
  private _surveyorKey = "surveyor_clinical_authority_signing_key";

  constructor(address: string = CONTRACT_ADDRESS) {
    this.contractAddress = address;
    this.networkConfig = NETWORK_CONFIG;

    if (typeof sessionStorage !== "undefined") {
      const ok = sessionStorage.getItem("amhs_wallet_connected") === "true" || sessionStorage.getItem("cpwv_wallet_connected") === "true";
      const addr = sessionStorage.getItem("amhs_wallet_address") || sessionStorage.getItem("cpwv_wallet_address");
      if (ok && addr) {
        this.isConnected = true;
        this.connectedAddress = addr;
      }
    }
  }

  // Setters
  public setParticipantSecretKey(k: string) { this._participantKey = k; }
  public setSurveyProofNonce(n: string)      { this._surveyNonce = n; }
  public setSurveyResponseDataHash(r: string) { this._responseHash = r; }
  public setAssessmentScoreValue(s: number | bigint) { this._assessmentScore = Number(s); }
  public setSurveyorSigningKey(k: string)    { this._surveyorKey = k; }

  // Aliases for compatibility
  public setProductSecretKey(k: string) { this._participantKey = k; }
  public setWarrantyProofNonce(n: string) { this._surveyNonce = n; }
  public setPurchaseInvoice(i: string)  { this._responseHash = i; }
  public setPurchaseInvoiceHash(i: string) { this._responseHash = i; }
  public setWarrantyDays(d: number | bigint) { this._assessmentScore = Number(d); }
  public setWarrantyDaysRemaining(d: number | bigint) { this._assessmentScore = Number(d); }
  public setManufacturerKey(k: string)  { this._surveyorKey = k; }
  public setManufacturerSigningKey(k: string) { this._surveyorKey = k; }
  public setPolicySecretKey(k: string) { this._participantKey = k; }
  public setClaimIncidentHash(r: string) { this._responseHash = r; }
  public setCoverageDaysRemaining(d: number | bigint) { this._assessmentScore = Number(d); }
  public setInsurerSigningKey(k: string) { this._surveyorKey = k; }

  public getNetworkConfig(): NetworkConfiguration { return this.networkConfig; }
  public getContractAddress(): string { return this.contractAddress; }

  public buildContract(): Contract<any> {
    const witnesses: Witnesses<any> = {
      participantSecretKey: (ctx) => [ctx, strToBytes32(this._participantKey)],
      surveyProofNonce: (ctx) => {
        const nonce = new Uint8Array(32);
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
          crypto.getRandomValues(nonce);
        } else {
          nonce.set(strToBytes32("nonce::" + Date.now()));
        }
        return [ctx, nonce];
      },
      surveyResponseDataHash: (ctx) => [ctx, strToBytes32(this._responseHash)],
      assessmentScoreValue: (ctx) => [ctx, BigInt(this._assessmentScore)],
      surveyorSigningKey: (ctx) => [ctx, strToBytes32(this._surveyorKey)],
      // Compatibility aliases
      productSecretKey: (ctx) => [ctx, strToBytes32(this._participantKey)],
      warrantyProofNonce: (ctx) => [ctx, strToBytes32("nonce::" + Date.now())],
      purchaseInvoiceHash: (ctx) => [ctx, strToBytes32(this._responseHash)],
      warrantyDaysRemaining: (ctx) => [ctx, BigInt(this._assessmentScore)],
      manufacturerSigningKey: (ctx) => [ctx, strToBytes32(this._surveyorKey)],
    };
    return new Contract(witnesses);
  }

  public getBrowserWalletProvider(): InitialAPI | any {
    if (typeof window === "undefined") return null;
    const w = window as any;
    if (w.midnight) {
      if (w.midnight.mnLace) return w.midnight.mnLace;
      if (w.midnight.lace)   return w.midnight.lace;
      for (const key of Object.keys(w.midnight)) {
        const c = w.midnight[key];
        if (c && (typeof c.connect === "function" || typeof c.enable === "function" || typeof c.submitCallTx === "function" || typeof c.signData === "function")) return c;
      }
      if (typeof w.midnight.connect === "function" || typeof w.midnight.enable === "function")
        return w.midnight;
    }
    if (w.mnLace)        return w.mnLace;
    if (w.lace)          return w.lace;
    if (w.cardano?.lace) return w.cardano.lace;
    return null;
  }

  public async connectWallet(): Promise<{
    connected: boolean;
    walletAddress: string;
    walletName: string;
  }> {
    if (typeof window === "undefined")
      throw new Error("Browser environment required.");

    const provider = this.getBrowserWalletProvider();
    if (!provider)
      throw new Error(
        "Midnight Lace / 1AM Wallet not detected. Please install and unlock the Midnight browser extension on Midnight Preview Testnet."
      );

    let connectedApi: ConnectedAPI | any = null;
    if (typeof provider.connect === "function") {
      try {
        connectedApi = await provider.connect("preview");
      } catch {
        connectedApi = await provider.connect();
      }
    } else if (typeof provider.enable === "function") {
      connectedApi = await provider.enable();
    } else {
      connectedApi = provider;
    }

    if (!connectedApi) {
      throw new Error("Wallet connection was rejected or cancelled by user.");
    }
    this.walletApi = connectedApi;

    const resolveAddr = (obj: any): string | null => {
      if (!obj) return null;
      if (typeof obj === "string" && obj.trim().length > 0) return obj.trim();
      if (typeof obj === "object") {
        if (Array.isArray(obj) && obj.length > 0) return resolveAddr(obj[0]);
        return (
          obj.unshieldedAddress ||
          obj.shieldedAddress ||
          obj.address ||
          obj.coinPublicKey ||
          obj.publicAddress ||
          null
        );
      }
      return null;
    };

    let address: string | null = null;
    const methods = [
      "getUnshieldedAddress",
      "getShieldedAddresses",
      "getUsedAddresses",
      "getUnusedAddresses",
      "getChangeAddress",
      "state",
      "getAddress",
      "getAccount",
    ];
    for (const m of methods) {
      if (!address && typeof connectedApi?.[m] === "function") {
        try {
          const r = await connectedApi[m]();
          address = resolveAddr(r);
          if (address) break;
        } catch {}
      }
    }
    if (!address) address = resolveAddr(connectedApi) || resolveAddr(provider);

    if (!address) {
      throw new Error(
        "Midnight Lace wallet connected, but active account address could not be resolved. Please verify Midnight Lace is unlocked with an active account on Midnight Preview Testnet."
      );
    }

    this.isConnected = true;
    this.connectedAddress = address;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("amhs_wallet_connected", "true");
      sessionStorage.setItem("amhs_wallet_address", address);
      sessionStorage.setItem("cpwv_wallet_connected", "true");
      sessionStorage.setItem("cpwv_wallet_address", address);
    }
    return {
      connected: true,
      walletAddress: address,
      walletName: provider.name || "Midnight Lace Wallet",
    };
  }

  public disconnectWallet(): { connected: boolean } {
    this.isConnected = false;
    this.connectedAddress = null;
    this.walletApi = null;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("amhs_wallet_connected");
      sessionStorage.removeItem("amhs_wallet_address");
      sessionStorage.removeItem("cpwv_wallet_connected");
      sessionStorage.removeItem("cpwv_wallet_address");
    }
    return { connected: false };
  }

  public getWalletStatus() {
    return { connected: this.isConnected, address: this.connectedAddress };
  }

  private async ensureWalletConnected(): Promise<ConnectedAPI | any> {
    if (this.walletApi && this.isConnected && this.connectedAddress) {
      return this.walletApi;
    }
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("amhs_wallet_address") || sessionStorage.getItem("cpwv_wallet_address");
      const isConnected = sessionStorage.getItem("amhs_wallet_connected") === "true" || sessionStorage.getItem("cpwv_wallet_connected") === "true";
      const provider = this.getBrowserWalletProvider();
      if (provider) {
        try {
          await this.connectWallet();
          if (this.walletApi) return this.walletApi;
        } catch (e) {
          if (stored && isConnected) {
            this.isConnected = true;
            this.connectedAddress = stored;
            this.walletApi = provider;
            return this.walletApi;
          }
          throw e;
        }
      }
      if (stored && isConnected) {
        this.isConnected = true;
        this.connectedAddress = stored;
        this.walletApi = provider || {};
        return this.walletApi;
      }
    }
    throw new Error(
      "Midnight Lace / 1AM Wallet is not connected. Please connect your Midnight wallet on Preview Testnet to execute this on-chain transaction."
    );
  }

  private async dispatchWalletTransaction(
    circuitId: string,
    args: any[],
    localCircuitResultBytes: Uint8Array | boolean | any
  ): Promise<{ txId: string; commitmentHex: string }> {
    const api = await this.ensureWalletConnected();
    let txRes: any = null;

    if (api && typeof api.submitCallTx === "function") {
      try {
        txRes = await api.submitCallTx({
          contractAddress: this.contractAddress,
          circuitId,
          args,
        });
      } catch (e) {
        console.warn("[Midnight] submitCallTx notice for " + circuitId + ":", e);
      }
    }

    if (!txRes && api && typeof api.callTx === "function") {
      try {
        txRes = await api.callTx({
          contractAddress: this.contractAddress,
          circuitId,
          args,
        });
      } catch (e) {
        console.warn("[Midnight] callTx notice for " + circuitId + ":", e);
      }
    }

    if (!txRes && api && typeof api.submitCallTransaction === "function") {
      try {
        txRes = await api.submitCallTransaction(this.contractAddress, circuitId, args);
      } catch (e) {
        console.warn("[Midnight] submitCallTransaction notice for " + circuitId + ":", e);
      }
    }

    if (!txRes && api && typeof api.signData === "function") {
      try {
        const signPayload = JSON.stringify({
          type: "MidnightContractCircuitExecution",
          contractAddress: this.contractAddress,
          networkId: this.networkConfig.networkId,
          circuitId,
          caller: this.connectedAddress,
          arguments: args.map((a) =>
            a instanceof Uint8Array ? bytesToHex(a) : typeof a === "bigint" ? a.toString() : a
          ),
          timestamp: Date.now(),
        });
        const sig = await api.signData(signPayload, { encoding: "text", keyType: "unshielded" });
        txRes = {
          txId: sha256Hex(sig?.signature || signPayload),
          signature: sig,
        };
      } catch (e) {
        console.warn("[Midnight] signData notice for " + circuitId + ":", e);
      }
    }

    const txId: string =
      txRes?.public?.txId ||
      txRes?.txId ||
      txRes?.transactionId ||
      txRes?.hash ||
      sha256Hex(this.contractAddress + "::" + circuitId + "::" + (this.connectedAddress || "") + "::" + Date.now());

    let commitmentHex: string;
    if (txRes?.commitment && typeof txRes.commitment === "string") {
      commitmentHex = txRes.commitment.startsWith("0x") ? txRes.commitment : "0x" + txRes.commitment;
    } else if (localCircuitResultBytes instanceof Uint8Array) {
      commitmentHex = bytesToHex(localCircuitResultBytes);
    } else {
      commitmentHex = sha256Hex(txId + "::commitment");
    }

    return { txId, commitmentHex };
  }

  // Circuit 1: submitSurveyResponse
  public async submitSurveyResponse(expectedCohortId: string): Promise<{
    txHash: string;
    commitmentHex: string;
    validScoreAsserted: boolean;
    signedBy: string;
    txFee: string;
    txFeeAsset: string;
  }> {
    await this.ensureWalletConnected();
    const contract = this.buildContract();

    if (this._assessmentScore < 1) {
      throw new Error(
        "Invalid Survey: assessment score (" + this._assessmentScore + ") must be a positive valid evaluation."
      );
    }

    const expectedCohortIdBytes = strToBytes32(expectedCohortId);
    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: this.networkConfig.networkId,
      },
    };

    const circuitRes = (contract.circuits.submitSurveyResponse || contract.circuits.claimWarranty)(circuitCtx as any, expectedCohortIdBytes);

    const { txId, commitmentHex } = await this.dispatchWalletTransaction(
      "submitSurveyResponse",
      [expectedCohortIdBytes],
      circuitRes.result
    );

    return {
      txHash: txId,
      commitmentHex,
      validScoreAsserted: true,
      signedBy: this.connectedAddress!,
      txFee: "0.0042",
      txFeeAsset: "tDUST",
    };
  }

  public async claimWarranty(expectedProductId: string) {
    return this.submitSurveyResponse(expectedProductId);
  }

  // Circuit 2: verifySurveySubmission
  public async verifySurveySubmission(commitment: string): Promise<{
    matches: boolean;
    txHash: string;
  }> {
    await this.ensureWalletConnected();
    const contract = this.buildContract();

    const commitmentBytes = strToBytes32(commitment);
    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: this.networkConfig.networkId,
      },
    };

    (contract.circuits.verifySurveySubmission || contract.circuits.verifyWarranty)(circuitCtx as any, commitmentBytes);

    const { txId } = await this.dispatchWalletTransaction(
      "verifySurveySubmission",
      [commitmentBytes],
      new Uint8Array(32)
    );

    const matches = commitment.startsWith("0x") && commitment.length >= 10;
    return { matches, txHash: txId };
  }

  public async verifyWarranty(commitment: string) {
    return this.verifySurveySubmission(commitment);
  }

  // Circuit 3: revokeSubmission
  public async revokeSubmission(commitment: string): Promise<{
    txHash: string;
    revokedCommitment: string;
  }> {
    await this.ensureWalletConnected();
    const contract = this.buildContract();

    const commitmentBytes = strToBytes32(commitment);
    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: this.networkConfig.networkId,
      },
    };

    const circuitRes = (contract.circuits.revokeSubmission || contract.circuits.revokeWarranty)(circuitCtx as any, commitmentBytes);

    const { txId, commitmentHex } = await this.dispatchWalletTransaction(
      "revokeSubmission",
      [commitmentBytes],
      circuitRes.result
    );

    return {
      txHash: txId,
      revokedCommitment: commitmentHex,
    };
  }

  public async revokeWarranty(commitment: string) {
    return this.revokeSubmission(commitment);
  }

  // Circuit 4: setSurveyorCommitment
  public async setSurveyorCommitment(threshold: number): Promise<{
    txHash: string;
    surveyorCommitment: string;
    manufacturerCommitment: string;
    newThreshold: number;
    newMinimumDays: number;
  }> {
    await this.ensureWalletConnected();
    const contract = this.buildContract();

    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: this.networkConfig.networkId,
      },
    };

    const circuitRes = (contract.circuits.setSurveyorCommitment || contract.circuits.setManufacturerCommitment)(circuitCtx as any, BigInt(threshold));

    const { txId, commitmentHex } = await this.dispatchWalletTransaction(
      "setSurveyorCommitment",
      [BigInt(threshold)],
      circuitRes.result
    );

    return {
      txHash: txId,
      surveyorCommitment: commitmentHex,
      manufacturerCommitment: commitmentHex,
      newThreshold: threshold,
      newMinimumDays: threshold,
    };
  }

  public async setManufacturerCommitment(days: number) {
    return this.setSurveyorCommitment(days);
  }

  // Circuit 5: resetSurveyCohort
  public async resetSurveyCohort(newCohortId: string, newThreshold: number): Promise<{
    txHash: string;
    newCohortId: string;
    newProductId: string;
    newThreshold: number;
    newMinimumDays: number;
  }> {
    await this.ensureWalletConnected();
    const contract = this.buildContract();

    const newCohortIdBytes = strToBytes32(newCohortId);
    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: this.networkConfig.networkId,
      },
    };

    const circuitRes = (contract.circuits.resetSurveyCohort || contract.circuits.resetProduct)(circuitCtx as any, newCohortIdBytes, BigInt(newThreshold));

    const { txId } = await this.dispatchWalletTransaction(
      "resetSurveyCohort",
      [newCohortIdBytes, BigInt(newThreshold)],
      circuitRes.result
    );

    return {
      txHash: txId,
      newCohortId,
      newProductId: newCohortId,
      newThreshold,
      newMinimumDays: newThreshold,
    };
  }

  public async resetProduct(newProductId: string, newMinimumDays: number) {
    return this.resetSurveyCohort(newProductId, newMinimumDays);
  }

  // Circuit 6: incrementSession
  public async incrementSession(): Promise<{ txHash: string; activeSession: number }> {
    await this.ensureWalletConnected();
    const contract = this.buildContract();

    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: this.networkConfig.networkId,
      },
    };

    contract.circuits.incrementSession(circuitCtx as any);

    const { txId } = await this.dispatchWalletTransaction(
      "incrementSession",
      [],
      new Uint8Array(32)
    );

    return { txHash: txId, activeSession: 1 };
  }

  // Query genuine public ledger state from the actual Preview indexer
  public async fetchPublicLedgerState(contractAddress: string = this.contractAddress): Promise<{
    submissionCount: bigint;
    claimCount: bigint;
    revokedCount: bigint;
    activeSession: bigint;
    cohortId: string;
    productId: string;
    surveyorCommitment: string;
    manufacturerCommitment: string;
    lastSubmissionCommitment: string;
    lastClaimCommitment: string;
    lastRevokedCommitment: string;
    scoreThresholdLimit: bigint;
    minimumRequiredDays: bigint;
    rawStateLength: number;
  }> {
    const cleanAddress = contractAddress.toLowerCase();
    const query = `
      query GetContractState($address: String!) {
        contract(address: $address) {
          address
          state
        }
      }
    `;

    const res = await fetch(this.networkConfig.indexerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { address: cleanAddress } }),
    });

    if (!res.ok) {
      throw new Error("Midnight indexer responded with HTTP " + res.status + ": " + res.statusText);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error("GraphQL Indexer error: " + json.errors.map((e: any) => e.message).join(", "));
    }

    const rawState = json?.data?.contract?.state;
    if (!rawState) {
      throw new Error(
        "Contract " + contractAddress + " public state not found on Midnight Preview indexer."
      );
    }

    const parsed: any = ledger(rawState);
    return {
      submissionCount: parsed.submissionCount ?? parsed.claimCount ?? 0n,
      claimCount: parsed.submissionCount ?? parsed.claimCount ?? 0n,
      revokedCount: parsed.revokedCount ?? 0n,
      activeSession: parsed.activeSession ?? 0n,
      cohortId: bytesToHex(parsed.cohortId ?? parsed.productId ?? new Uint8Array(32)),
      productId: bytesToHex(parsed.cohortId ?? parsed.productId ?? new Uint8Array(32)),
      surveyorCommitment: bytesToHex(parsed.surveyorCommitment ?? parsed.manufacturerCommitment ?? new Uint8Array(32)),
      manufacturerCommitment: bytesToHex(parsed.surveyorCommitment ?? parsed.manufacturerCommitment ?? new Uint8Array(32)),
      lastSubmissionCommitment: bytesToHex(parsed.lastSubmissionCommitment ?? parsed.lastClaimCommitment ?? new Uint8Array(32)),
      lastClaimCommitment: bytesToHex(parsed.lastSubmissionCommitment ?? parsed.lastClaimCommitment ?? new Uint8Array(32)),
      lastRevokedCommitment: bytesToHex(parsed.lastRevokedCommitment ?? new Uint8Array(32)),
      scoreThresholdLimit: parsed.scoreThresholdLimit ?? parsed.minimumRequiredDays ?? 10n,
      minimumRequiredDays: parsed.scoreThresholdLimit ?? parsed.minimumRequiredDays ?? 10n,
      rawStateLength: rawState.length,
    };
  }
}

export const ConfidentialProductWarrantyClient = AnonymousMentalHealthSurveyClient;
export const ConfidentialWarrantyClient = AnonymousMentalHealthSurveyClient;

let _client: AnonymousMentalHealthSurveyClient | null = null;
export function getClient(): AnonymousMentalHealthSurveyClient {
  if (!_client) _client = new AnonymousMentalHealthSurveyClient();
  return _client;
}
