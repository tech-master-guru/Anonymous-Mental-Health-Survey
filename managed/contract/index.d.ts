import type * as __compactRuntime from "@midnight-ntwrk/compact-runtime";

export type Ledger = {
  readonly submissionCount: bigint;
  readonly revokedCount: bigint;
  readonly activeSession: bigint;
  readonly cohortId: Uint8Array;
  readonly surveyorCommitment: Uint8Array;
  readonly lastSubmissionCommitment: Uint8Array;
  readonly lastRevokedCommitment: Uint8Array;
  readonly scoreThresholdLimit: bigint;
  // Aliases
  readonly claimCount: bigint;
  readonly productId: Uint8Array;
  readonly manufacturerCommitment: Uint8Array;
  readonly lastClaimCommitment: Uint8Array;
  readonly minimumRequiredDays: bigint;
};

export type Witnesses<PS> = {
  participantSecretKey(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  surveyProofNonce(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  surveyResponseDataHash(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  assessmentScoreValue(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  surveyorSigningKey(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  // Aliases
  productSecretKey?(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  warrantyProofNonce?(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  purchaseInvoiceHash?(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  warrantyDaysRemaining?(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  manufacturerSigningKey?(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
};

export type ImpureCircuits<PS> = {
  submitSurveyResponse(ctx: __compactRuntime.CircuitContext<PS>, expectedCohortId: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifySurveySubmission(ctx: __compactRuntime.CircuitContext<PS>, claimedCommitment: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeSubmission(ctx: __compactRuntime.CircuitContext<PS>, commitmentToRevoke: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setSurveyorCommitment(ctx: __compactRuntime.CircuitContext<PS>, newScoreThreshold: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetSurveyCohort(ctx: __compactRuntime.CircuitContext<PS>, newCohortId: Uint8Array, newThreshold: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(ctx: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  // Aliases
  claimWarranty(ctx: __compactRuntime.CircuitContext<PS>, expectedProductId: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyWarranty(ctx: __compactRuntime.CircuitContext<PS>, claimedCommitment: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeWarranty(ctx: __compactRuntime.CircuitContext<PS>, commitmentToRevoke: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setManufacturerCommitment(ctx: __compactRuntime.CircuitContext<PS>, newMinimumDays: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProduct(ctx: __compactRuntime.CircuitContext<PS>, newProductId: Uint8Array, newMinimumDays: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
};

export type ProvableCircuits<PS> = ImpureCircuits<PS>;
export type PureCircuits = Record<string, never>;
export type Circuits<PS> = ImpureCircuits<PS>;

export type ContractReferenceLocations = Record<string, never>;
export declare const contractReferenceLocations: ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(ctx: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
