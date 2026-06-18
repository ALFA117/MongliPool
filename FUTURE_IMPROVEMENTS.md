# MongliPool — Future Improvements

This document lists improvements beyond the hackathon MVP, organized by category.

---

## Product / Use Cases

- **Variable amounts** — Support deposit denominations beyond the fixed 1 XLM (e.g., 1, 10, 100 XLM) for better utility. Requires circuit changes to include amount as a public input.
- **Multi-asset pools** — Support USDC, other Soroban tokens, not just XLM. Separate pool contracts per asset.
- **Denomination-based pools** — Like Tornado Cash: separate pools by amount (0.1, 1, 10, 100 XLM) for stronger anonymity within each pool.
- **Recurring private payments** — "Private payroll" mode for DAOs: schedule periodic deposits that contributors can withdraw privately.
- **DAO bot integration** — Discord/Telegram bot for Mongli DAO to notify when deposits are ready for audit or when pool state changes.

## Security & Decentralization

- **Asymmetric view key** — Replace the hardcoded symmetric key with DAO multisig (3-of-5 minimum) using NaCl box public key encryption. Only the DAO's private key (offline, multisig) can decrypt.
- **Public trusted setup ceremony** — Replace the local PoT15 ceremony with a multi-participant MPC ceremony (e.g., Hermez/PSE perpetual Powers of Tau with 15+ participants).
- **Decentralized root updates** — Replace permissionless `update_root` with a trusted relayer system with fraud proofs, or compute the Merkle tree on-chain inside `deposit()`.
- **External circuit audit** — Professional security audit of `withdraw.circom` and all three Soroban contracts before any use with real funds.
- **Deposit rate limiting** — Anti-spam protection on `deposit()` to prevent pool flooding with junk commitments.
- **Nullifier set as Merkle tree** — Current linear scan of nullifiers is O(n). Replace with a Merkle tree or bloom filter for O(log n) lookups.

## UX & Accessibility

- **Interactive onboarding** — 3-screen tutorial for first-time users: what is Freighter, how to get testnet XLM, what is a "private receipt".
- **Multi-wallet support** — xBull, Lobstr, Hana wallets via stellar-wallets-kit (already supports them, just needs UI integration).
- **Encrypted receipt storage** — "Remember my receipt" mode with local password encryption, exportable/importable between devices. Clear warning that this is convenience, not a substitute for external backup.
- **Withdrawal timing notifications** — Push/email when it's safe to withdraw (e.g., after N additional deposits from other users, for better anonymity).
- **Anonymity meter** — Visual indicator of "current anonymity level" based on how many deposits have been made since yours (more deposits = larger anonymity set).
- **Better error messages** — Replace raw Soroban errors with human-readable explanations and recovery suggestions.

## Infrastructure

- **Custom event indexer** — Replace dependency on Soroban RPC's ~24h event retention with a dedicated indexer that stores the complete deposit history. Required for the Auditor to work on all historical deposits.
- **Encrypted receipt backup service** — Optional, consent-based cloud backup of receipts (encrypted client-side before upload) for users who fear losing their only receipt.
- **Public pool metrics** — TVL, deposit count, average time between deposit and withdrawal, anonymity set size — displayed on the Status page.
- **Multi-thread ZK proof** — Enable COEP/COOP headers with a service worker proxy to allow SharedArrayBuffer, reducing proof time from ~30s to ~5s.
- **Mainnet deployment** — After audit, deploy to Stellar mainnet with proper trusted setup and real asset support.

---

*This list is intentionally aspirational. MongliPool is a hackathon MVP — these improvements represent the path from prototype to production.*