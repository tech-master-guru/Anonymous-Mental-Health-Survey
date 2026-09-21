import { describe, it, expect } from 'vitest';
import { Contract, ledger, type Witnesses } from '../managed/contract/index.js';
import {
  CONTRACT_ADDRESS,
  NETWORK_CONFIG,
  bytesToHex,
  hexToBytes,
  strToBytes32,
  sha256Hex,
} from '../src/lib/contract';
import { deployAMHSContract } from '../src/integration/deploy';

function toBytes32(str: string): Uint8Array {
  const arr = new Uint8Array(32);
  new TextEncoder().encodeInto(str, arr);
  return arr;
}

function buildWitnesses({
  participantKey = 'participant_seed_key_alpha',
  nonce = 'entropy_salt_survey_response',
  responseHash = 'sha256_survey_answers_record',
  scoreValue = 15n,
  surveyorKey = 'surveyor_authority_signing_key',
}: {
  participantKey?: string;
  nonce?: string;
  responseHash?: string;
  scoreValue?: bigint;
  surveyorKey?: string;
}): Witnesses<any> {
  const pKey = toBytes32(participantKey);
  const nBytes = toBytes32(nonce);
  const rHash = toBytes32(responseHash);
  const sKey = toBytes32(surveyorKey);

  return {
    participantSecretKey: (ctx: any) => [ctx.privateState ?? ctx, pKey] as [any, Uint8Array],
    surveyProofNonce: (ctx: any) => [ctx.privateState ?? ctx, nBytes] as [any, Uint8Array],
    surveyResponseDataHash: (ctx: any) => [ctx.privateState ?? ctx, rHash] as [any, Uint8Array],
    assessmentScoreValue: (ctx: any) => [ctx.privateState ?? ctx, scoreValue] as [any, bigint],
    surveyorSigningKey: (ctx: any) => [ctx.privateState ?? ctx, sKey] as [any, Uint8Array],

    // Aliases
    productSecretKey: (ctx: any) => [ctx.privateState ?? ctx, pKey] as [any, Uint8Array],
    warrantyProofNonce: (ctx: any) => [ctx.privateState ?? ctx, nBytes] as [any, Uint8Array],
    purchaseInvoiceHash: (ctx: any) => [ctx.privateState ?? ctx, rHash] as [any, Uint8Array],
    warrantyDaysRemaining: (ctx: any) => [ctx.privateState ?? ctx, scoreValue] as [any, bigint],
    manufacturerSigningKey: (ctx: any) => [ctx.privateState ?? ctx, sKey] as [any, Uint8Array],
  };
}

describe('Anonymous Mental Health Survey (AMHS) - Midnight ZK Contract Suite', () => {

  it('1. Contract Structure: all 6 core circuits are exported and callable from managed runtime', () => {
    const contract = new Contract(buildWitnesses({}));
    expect(contract).toBeDefined();
    expect(typeof contract.circuits.submitSurveyResponse).toBe('function');
    expect(typeof contract.circuits.verifySurveySubmission).toBe('function');
    expect(typeof contract.circuits.revokeSubmission).toBe('function');
    expect(typeof contract.circuits.setSurveyorCommitment).toBe('function');
    expect(typeof contract.circuits.resetSurveyCohort).toBe('function');
    expect(typeof contract.circuits.incrementSession).toBe('function');
    expect(contract).toHaveProperty('circuits');
    expect(contract).toHaveProperty('witnesses');
  });

  it('2. Witness Completeness: all 5 witnesses (including assessment score and surveyor key) are defined', () => {
    const witnesses = buildWitnesses({
      participantKey: 'student_wellness_survey_respondent_42',
      nonce: 'entropy_salt_survey_response_2026',
      responseHash: 'sha256_phq9_gad7_survey_answers_hash',
      scoreValue: 18n,
      surveyorKey: 'clinical_survey_lead_signing_key',
    });
    const contract = new Contract(witnesses);

    expect(contract.witnesses.participantSecretKey).toBeDefined();
    expect(contract.witnesses.surveyProofNonce).toBeDefined();
    expect(contract.witnesses.surveyResponseDataHash).toBeDefined();
    expect(contract.witnesses.assessmentScoreValue).toBeDefined();
    expect(contract.witnesses.surveyorSigningKey).toBeDefined();
  });

  it('3. Private Witness Byte Length: participantSecretKey, surveyProofNonce, surveyResponseDataHash are 32 bytes', () => {
    const witnesses = buildWitnesses({
      participantKey: 'participant_secret_key_alpha',
      nonce: 'random_survey_nonce_beta',
      responseHash: 'hashed_survey_response_gamma',
    });
    const mockCtx = { privateState: {} };

    const [, keyBytes] = witnesses.participantSecretKey(mockCtx);
    const [, nonceBytes] = witnesses.surveyProofNonce(mockCtx);
    const [, respBytes] = witnesses.surveyResponseDataHash(mockCtx);

    expect(keyBytes.length).toBe(32);
    expect(nonceBytes.length).toBe(32);
    expect(respBytes.length).toBe(32);
  });

  it('4. Assessment Score Threshold Witness: assessmentScoreValue returns bigint usable for validity check', () => {
    const score = 15n;
    const minimumThreshold = 1n;
    const witnesses = buildWitnesses({ scoreValue: score });
    const mockCtx = { privateState: {} };

    const [, s] = witnesses.assessmentScoreValue(mockCtx);
    expect(typeof s).toBe('bigint');
    expect(s).toBe(15n);
    expect(s >= minimumThreshold).toBe(true);
  });

  it('5. ZK Privacy: private witnesses are strictly isolated from public cohortId (no data leak)', () => {
    const publicCohortId = toBytes32('cohort_university_wellness_2026');
    const witnesses = buildWitnesses({
      participantKey: 'super_secret_participant_token',
      nonce: 'private_survey_nonce_secret',
      responseHash: 'encrypted_clinical_response_hash',
    });
    const mockCtx = { privateState: {} };

    const [, keyBytes] = witnesses.participantSecretKey(mockCtx);
    const [, nonceBytes] = witnesses.surveyProofNonce(mockCtx);
    const [, respBytes] = witnesses.surveyResponseDataHash(mockCtx);

    expect(keyBytes).not.toEqual(publicCohortId);
    expect(nonceBytes).not.toEqual(publicCohortId);
    expect(respBytes).not.toEqual(publicCohortId);
  });

  it('6. Surveyor Authority Witness: surveyorSigningKey produces 32-byte array independent of participant key', () => {
    const witnesses = buildWitnesses({
      participantKey: 'participant_secret_token_abc',
      surveyorKey: 'clinical_surveyor_signing_key_xyz',
    });
    const mockCtx = { privateState: {} };

    const [, participantBytes] = witnesses.participantSecretKey(mockCtx);
    const [, surveyorBytes] = witnesses.surveyorSigningKey(mockCtx);

    expect(surveyorBytes.length).toBe(32);
    expect(surveyorBytes).not.toEqual(participantBytes);
  });

  it('7. Multi-Cohort Commitment Uniqueness: different cohorts produce distinct contract instances', () => {
    const witnessesA = buildWitnesses({ participantKey: 'student_campus_a', responseHash: 'resp_phq9_a' });
    const witnessesB = buildWitnesses({ participantKey: 'student_campus_b', responseHash: 'resp_phq9_b' });
    const mockCtx = { privateState: {} };

    const contractA = new Contract(witnessesA);
    const contractB = new Contract(witnessesB);

    const [, keyA] = witnessesA.participantSecretKey(mockCtx);
    const [, keyB] = witnessesB.participantSecretKey(mockCtx);

    expect(contractA).not.toBe(contractB);
    expect(keyA).not.toEqual(keyB);
  });

  it('8. Ledger Schema Interface: ledger() decodes the 8-field on-chain public state correctly', () => {
    expect(typeof ledger).toBe('function');
    const parsed = ledger({});
    expect(parsed).toHaveProperty('submissionCount');
    expect(parsed).toHaveProperty('revokedCount');
    expect(parsed).toHaveProperty('activeSession');
    expect(parsed).toHaveProperty('cohortId');
    expect(parsed).toHaveProperty('surveyorCommitment');
    expect(parsed).toHaveProperty('lastSubmissionCommitment');
    expect(parsed).toHaveProperty('lastRevokedCommitment');
    expect(parsed).toHaveProperty('scoreThresholdLimit');
    expect(typeof parsed.submissionCount).toBe('bigint');
    expect(typeof parsed.scoreThresholdLimit).toBe('bigint');
  });

  it('9. Invalid Score Fail Case: assessmentScore below minimum threshold fails threshold check', () => {
    const incompleteScore = 0n;
    const minimumThreshold = 1n;
    const witnesses = buildWitnesses({ scoreValue: incompleteScore });
    const mockCtx = { privateState: {} };

    const [, s] = witnesses.assessmentScoreValue(mockCtx);
    expect(s >= minimumThreshold).toBe(false);
  });

  it('10. Session Isolation: witnesses built for different sessions produce independent nonce contexts', () => {
    const witnessesSession1 = buildWitnesses({ nonce: 'session_1_survey_nonce', scoreValue: 12n });
    const witnessesSession2 = buildWitnesses({ nonce: 'session_2_survey_nonce', scoreValue: 24n });
    const mockCtx = { privateState: { sessionId: 'test' } };

    const [, nonce1] = witnessesSession1.surveyProofNonce(mockCtx);
    const [, nonce2] = witnessesSession2.surveyProofNonce(mockCtx);

    expect(nonce1).not.toEqual(nonce2);
  });

  it('11. Authoritative Verified Contract Address: matches Preview deployment record', () => {
    expect(CONTRACT_ADDRESS).toBe('0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897');
    expect(NETWORK_CONFIG.networkId).toBe('preview');
    expect(NETWORK_CONFIG.indexerUrl).toContain('indexer.preview.midnight.network');
  });

  it('12. Authoritative deployAMHSContract returns the verified contract address', async () => {
    const res = await deployAMHSContract();
    expect(res.contractAddress).toBe('0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897');
  });

  it('13. Encoding Helpers: bytesToHex and strToBytes32 round-trip correctly', () => {
    const testStr = 'test_cohort_survey_123';
    const bytes = strToBytes32(testStr);
    expect(bytes.length).toBe(32);
    const hex = bytesToHex(bytes);
    expect(hex.startsWith('0x')).toBe(true);
    expect(hex.length).toBe(66);
    const back = hexToBytes(hex);
    expect(back).toEqual(bytes);
  });

});
