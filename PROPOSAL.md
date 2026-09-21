# Project Proposal: Anonymous Mental Health Survey (AMHS)
> **Privacy-Preserving Zero-Knowledge Mental Health Assessment & Clinical Study Protocol on Midnight Network**

---

## Live Deployments & Demo Video

> **Interactive Web Application & Live Video Walkthrough**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20DApp-000000?style=for-the-badge&logo=vercel)](https://anonymous-mental-health-survey.vercel.app)
[![AMHS Video Walkthrough](https://img.shields.io/badge/YouTube-Watch%20Live%20Demo-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/vxdjW446PL0)
[![Contract Explorer](https://img.shields.io/badge/Midnight-Preview%20Contract-8b5cf6?style=for-the-badge)](https://preview.midnightexplorer.com/contracts/0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897)

- **Live DApp Deployment**: [https://anonymous-mental-health-survey.vercel.app](https://anonymous-mental-health-survey.vercel.app)
- **YouTube Video Walkthrough**: [https://youtu.be/vxdjW446PL0](https://youtu.be/vxdjW446PL0)
- **Midnight Preview Explorer**: [https://preview.midnightexplorer.com/contracts/0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897](https://preview.midnightexplorer.com/contracts/0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897)

---

## 1. Executive Summary

Mental health conditions represent one of the largest public health burdens globally. Accurate clinical and sociological data collection is essential for understanding prevalence, identifying high-risk demographics, and allocating resources effectively.

However, existing survey methodologies present critical privacy bottlenecks:
- **Centralized Data Storage**: Raw responses are coupled with participant identifiers, IP addresses, and timestamps.
- **Stigma & Non-Disclosure**: Individuals suffering from depression, anxiety, trauma, or substance use fear reputational harm, professional penalties, or insurance denials.
- **Data Breaches & Subpoenas**: Centralized health survey providers remain high-value targets for malicious actors.

**Anonymous Mental Health Survey (AMHS)** solves this dilemma through **Midnight Network's zero-knowledge architecture**. By leveraging Compact smart contracts, AMHS decouples proof of valid response from participant identity, enabling trustworthy public health data without sacrificing individual privacy.

---

## 2. Problem Statement & Impact

| Traditional Survey Systems | Anonymous Mental Health Survey (AMHS) |
|---|---|
| Centralized databases store raw participant responses. | Responses are verified client-side via zero-knowledge proofs. |
| Identity, IP address, and metadata are logged by servers. | Only a blinded cryptographic commitment is recorded on-chain. |
| Vulnerable to corporate subpoenas and data breaches. | No participant identity exists on-chain or in server databases. |
| High rate of participant drop-off due to privacy concerns. | Participants retain cryptographic control and can revoke submissions. |

---

## 3. Core Architecture & Midnight Integration

### On-Chain Contract & Explorer
- **Network**: Midnight Preview Testnet
- **Contract Address**: `0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897`
- **Explorer URL**: [https://preview.midnightexplorer.com/contracts/0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897](https://preview.midnightexplorer.com/contracts/0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897)

### Compact Smart Contract Circuits
1. `submitSurveyResponse`: Proves eligibility and score threshold compliance via private witnesses without revealing the raw score or participant key.
2. `verifySurveySubmission`: Verifies the on-chain inclusion of a specific survey response commitment.
3. `revokeSubmission`: Empowers the participant to retract their submission from the active research pool.
4. `setSurveyorCommitment`: Allows authenticated clinical researchers to adjust qualification thresholds.
5. `resetSurveyCohort`: Rotates the active research cohort for new longitudinal studies.
6. `incrementSession`: Advances the session state for anti-replay security.

---

## 4. Verification & Testing

The protocol has been rigorously verified using automated tests:
- **13 Passing Tests**: Cover circuit execution, ledger state mutators, witness providers, and error handling.
- **Next.js 14 Production Build**: Zero compilation errors across all static pages (`/`, `/claim`, `/admin`, `/explorer`).

---

## 5. Roadmap

- [x] **Phase 1**: Compact contract architecture & circuit formalization.
- [x] **Phase 2**: Deployment to Midnight Preview Testnet (`0x2bf4b7...1819d897`).
- [x] **Phase 3**: Next.js 14 frontend with Midnight Lace wallet and direct proof submission.
- [x] **Phase 4**: Automated Vitest suite (13/13 passing tests).
- [ ] **Phase 5**: Multi-institution collaborative cohort aggregation and decentralized ZK threshold encryption for clinical research studies.

---

## 6. Author

- **Author**: `tech-master-guru`
- **Email**: `shuvamdutta596@gmail.com`
- **GitHub**: [https://github.com/tech-master-guru/Anonymous-Mental-Health-Survey](https://github.com/tech-master-guru/Anonymous-Mental-Health-Survey)
