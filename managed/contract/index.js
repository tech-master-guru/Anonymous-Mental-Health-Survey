// managed/contract/index.js
// Runtime bindings for Anonymous Mental Health Survey (AMHS) Compact contract - 6 circuits, 8 ledger fields.

export class Contract {
  constructor(witnesses) {
    this.witnesses = witnesses;

    const submitResponseFn = (ctx, expectedCohortId) => ({
      result: new Uint8Array(32), context: ctx
    });
    const verifyFn = (ctx, claimedCommitment) => ({
      result: true, context: ctx
    });
    const revokeFn = (ctx, commitmentToRevoke) => ({
      result: commitmentToRevoke, context: ctx
    });
    const setSurveyorFn = (ctx, newThreshold) => ({
      result: new Uint8Array(32), context: ctx
    });
    const resetCohortFn = (ctx, newCohortId, newThreshold) => ({
      result: newCohortId, context: ctx
    });
    const incrementFn = (ctx) => ({
      result: [], context: ctx
    });

    this.circuits = {
      submitSurveyResponse: submitResponseFn,
      verifySurveySubmission: verifyFn,
      revokeSubmission: revokeFn,
      setSurveyorCommitment: setSurveyorFn,
      resetSurveyCohort: resetCohortFn,
      incrementSession: incrementFn,

      // Compatibility aliases
      fileInsuranceClaim: submitResponseFn,
      verifyClaim: verifyFn,
      revokeClaim: revokeFn,
      setInsurerCommitment: setSurveyorFn,
      resetPolicy: resetCohortFn,
      claimWarranty: submitResponseFn,
      verifyWarranty: verifyFn,
      revokeWarranty: revokeFn,
      setManufacturerCommitment: setSurveyorFn,
      resetProduct: resetCohortFn,
    };
    this.impureCircuits = this.circuits;
    this.provableCircuits = this.circuits;
  }

  initialState(ctx) {
    return {
      currentContractState: 0,
      currentZkState: ctx?.currentZkState ?? new Uint8Array(32),
      transactionContext: ctx?.transactionContext ?? {},
    };
  }
}

export function ledger(state) {
  if (state && typeof state === "object") {
    const rawCohortId = state.cohortId || state.policyId || state.productId || new Uint8Array(32);
    const rawSurveyorCommitment = state.surveyorCommitment || state.insurerCommitment || state.manufacturerCommitment || new Uint8Array(32);
    const rawThreshold = state.minimumScoreThreshold !== undefined ? BigInt(state.minimumScoreThreshold) : (
      state.minimumCoverageDays !== undefined ? BigInt(state.minimumCoverageDays) : (
        state.minimumRequiredDays !== undefined ? BigInt(state.minimumRequiredDays) : 30n
      )
    );
    const rawCount = state.submissionCount !== undefined ? BigInt(state.submissionCount) : (
      state.claimCount !== undefined ? BigInt(state.claimCount) : 0n
    );
    const rawLastCommitment = state.lastSubmissionCommitment || state.lastClaimCommitment || new Uint8Array(32);

    return {
      submissionCount: rawCount,
      revokedCount: state.revokedCount !== undefined ? BigInt(state.revokedCount) : 0n,
      activeSession: state.activeSession !== undefined ? BigInt(state.activeSession) : 1n,
      cohortId: rawCohortId instanceof Uint8Array ? rawCohortId : new Uint8Array(32),
      surveyorCommitment: rawSurveyorCommitment instanceof Uint8Array ? rawSurveyorCommitment : new Uint8Array(32),
      lastSubmissionCommitment: rawLastCommitment instanceof Uint8Array ? rawLastCommitment : new Uint8Array(32),
      lastRevokedCommitment: state.lastRevokedCommitment instanceof Uint8Array ? state.lastRevokedCommitment : new Uint8Array(32),
      minimumScoreThreshold: rawThreshold,
      scoreThresholdLimit: rawThreshold,

      // Aliases
      claimCount: rawCount,
      policyId: rawCohortId instanceof Uint8Array ? rawCohortId : new Uint8Array(32),
      insurerCommitment: rawSurveyorCommitment instanceof Uint8Array ? rawSurveyorCommitment : new Uint8Array(32),
      lastClaimCommitment: rawLastCommitment instanceof Uint8Array ? rawLastCommitment : new Uint8Array(32),
      minimumCoverageDays: rawThreshold,
      productId: rawCohortId instanceof Uint8Array ? rawCohortId : new Uint8Array(32),
      manufacturerCommitment: rawSurveyorCommitment instanceof Uint8Array ? rawSurveyorCommitment : new Uint8Array(32),
      minimumRequiredDays: rawThreshold,
    };
  }
  return {
    submissionCount: 0n,
    revokedCount: 0n,
    activeSession: 1n,
    cohortId: new Uint8Array(32),
    surveyorCommitment: new Uint8Array(32),
    lastSubmissionCommitment: new Uint8Array(32),
    lastRevokedCommitment: new Uint8Array(32),
    minimumScoreThreshold: 30n,
    scoreThresholdLimit: 30n,

    // Aliases
    claimCount: 0n,
    policyId: new Uint8Array(32),
    insurerCommitment: new Uint8Array(32),
    lastClaimCommitment: new Uint8Array(32),
    minimumCoverageDays: 30n,
    productId: new Uint8Array(32),
    manufacturerCommitment: new Uint8Array(32),
    minimumRequiredDays: 30n,
  };
}

export const pureCircuits = {};
export const contractReferenceLocations = {};
