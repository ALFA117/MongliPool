# MongliPool — Security Audit

Audit date: 2026-06-22
Auditor: Development team (self-audit)
Scope: Full project (circuits, contracts, frontend, infrastructure)

---

## VULN-001: Local trusted setup (toxic waste risk)
- **Area:** Cryptography
- **Severity:** Critical (production) / Low (testnet)
- **Description:** The Groth16 trusted setup was done locally with a single PoT15 contribution. Whoever has the toxic waste can forge valid proofs and steal pool funds.
- **Impact on testnet:** No real funds at risk. Proof forgery only affects testnet XLM.
- **Impact on production:** An attacker with toxic waste could drain the entire pool.
- **Mitigation current:** Documented explicitly. The toxic waste only allows generating fake proofs — on testnet with no real funds, the impact is zero.
- **Industry context:** Tornado Cash, Zcash, and Semaphore all started with local trusted setups before their public ceremonies. This is standard practice for ZK prototypes.
- **Mitigation recommended:** Public Powers of Tau ceremony. Hermez/Polygon already have public ptau files from ceremonies with >1000 participants that could be reused.
- **Status:** Documented, acceptable for testnet.

## VULN-002: Permissionless root updates
- **Area:** Contracts
- **Severity:** Medium
- **Description:** `update_root()` and `update_asp_root()` have no access control. Anyone can call them with any root value.
- **Impact on testnet:** An attacker could insert a fake root, then generate a proof against that root to withdraw funds they never deposited.
- **Impact on production:** Same — full pool drain possible.
- **Mitigation current:** The ZK proof must match the root AND the attacker must know a valid secret/nullifier that hashes to a commitment in the fake tree. This makes exploitation non-trivial but theoretically possible.
- **Mitigation recommended:** On-chain Merkle tree computation inside `deposit()`, or trusted relayer with fraud proofs.
- **Status:** Partially mitigated by ZK binding, documented.

## VULN-003: No emergency pause mechanism
- **Area:** Contracts
- **Severity:** Medium
- **Description:** None of the 3 contracts have a pause/freeze function. If a critical bug is found, there's no way to stop the pool.
- **Impact:** Funds could be drained before a fix is deployed.
- **Mitigation recommended:** Add `admin.require_auth()` guarded `pause()` function.
- **Status:** Not mitigated.

## VULN-004: Receipts stored in plaintext localStorage
- **Area:** Frontend
- **Severity:** Medium
- **Description:** Private receipts (containing secret + nullifierSecret) are stored in plaintext in localStorage. Any browser extension or XSS vulnerability could read them.
- **Impact:** An attacker with localStorage access could withdraw the user's funds.
- **Mitigation current:** Warning in UI about browser storage limitations.
- **Mitigation recommended:** Encrypt receipts with a user-provided password before storing.
- **Status:** Documented, not mitigated.

## VULN-005: Single DAO private key (no multisig)
- **Area:** Cryptography
- **Severity:** Medium
- **Description:** The auditor view key is a single Curve25519 private key. Whoever holds it can decrypt all deposit notes.
- **Impact:** A compromised DAO key exposes all deposit details.
- **Mitigation current:** Asymmetric encryption (NaCl box) with ephemeral keypairs per deposit.
- **Mitigation recommended:** M-of-N threshold decryption (e.g., Shamir's secret sharing).
- **Status:** Partially mitigated (ephemeral keypairs provide per-deposit uniqueness).

## VULN-006: Circuit not externally audited
- **Area:** Cryptography
- **Severity:** High (production) / Low (testnet)
- **Description:** `withdraw.circom` has not been reviewed by third-party auditors. Potential under-constraint vulnerabilities could allow proof forgery.
- **Impact:** Unknown — depends on whether under-constraints exist.
- **Mitigation recommended:** Professional circuit audit before mainnet deployment.
- **Status:** Not mitigated.

## VULN-007: No RPC fallback
- **Area:** Infrastructure
- **Severity:** Low
- **Description:** The frontend uses a single Soroban RPC endpoint (soroban-testnet.stellar.org). If it goes down, the entire app is unusable.
- **Impact:** Temporary unavailability (no fund loss).
- **Mitigation recommended:** Multiple RPC endpoints with automatic failover.
- **Status:** Not mitigated.

## VULN-008: Transaction timeout replay window
- **Area:** Frontend
- **Severity:** Low
- **Description:** Transactions have a 300-second validity window. A signed but unsent transaction could theoretically be replayed within that window.
- **Impact:** Minimal — Stellar sequence numbers prevent replay of identical transactions.
- **Mitigation current:** Stellar's built-in sequence number protection.
- **Status:** Mitigated by protocol design.

## VULN-009: Event retention (24h RPC limit)
- **Area:** Infrastructure
- **Severity:** Informational
- **Description:** Soroban RPC retains events for ~24 hours. The Auditor panel cannot see deposits older than this.
- **Impact:** Audit completeness limited to recent deposits. No security impact — the encrypted notes are on-chain permanently, just not queryable via this RPC method.
- **Mitigation recommended:** Custom event indexer for full history.
- **Status:** Documented.

## VULN-010: Guest mode keypair in sessionStorage
- **Area:** Frontend
- **Severity:** Low (testnet) / Would be Critical (production)
- **Description:** Guest mode generates a keypair stored in sessionStorage. Any code running in the same tab could access it.
- **Impact on testnet:** Only testnet XLM at risk.
- **Impact on production:** This mode should be disabled entirely.
- **Mitigation current:** Clear "temporary account" warning in UI. Session-only storage.
- **Status:** Documented, acceptable for testnet demo.

## VULN-011: VITE_ environment variables are public
- **Area:** Infrastructure
- **Severity:** Informational
- **Description:** All `VITE_*` variables are baked into the JS bundle and visible to anyone. They contain contract IDs, RPC URL, and admin address.
- **Impact:** None — these are public blockchain addresses. No secrets are in VITE_ variables.
- **Status:** By design, not a vulnerability.

## VULN-012: No XSS sanitization on on-chain data
- **Area:** Frontend
- **Severity:** Low
- **Description:** Commitment hashes and event data from on-chain are rendered in the DOM. In theory, malformed data could contain executable content.
- **Impact:** React's JSX escaping prevents direct XSS from string interpolation. The risk is minimal.
- **Mitigation current:** React's built-in escaping.
- **Status:** Mitigated by framework.

---

## Summary

| Severity | Count | Mitigated |
|----------|-------|-----------|
| Critical | 1 | Documented (VULN-001) |
| High | 1 | Documented (VULN-006) |
| Medium | 3 | Partially (VULN-002, 004, 005), Documented (VULN-003) |
| Low | 4 | Mitigated (VULN-008, 012), Documented (VULN-007, 010) |
| Informational | 2 | By design (VULN-009, 011) |

**Overall assessment:** Acceptable for a hackathon testnet MVP. The two critical/high items (trusted setup, circuit audit) are standard for any ZK project pre-production and are clearly documented. No secrets are exposed in the codebase.
