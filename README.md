# MongliPool

**ZK Privacy Pool on Stellar — with built-in regulatory compliance.**

[![Stellar Hacks: ZK](https://img.shields.io/badge/Hackathon-Stellar%20Hacks%3A%20ZK-05D5A1)](https://dorahacks.io/hackathon/stellar-hacks-zk)
[![Live Demo](https://img.shields.io/badge/Demo-mongli--pool.vercel.app-0066FF)](https://mongli-pool.vercel.app)
[![Video Demo](https://img.shields.io/badge/Video-YouTube-red)](https://youtu.be/Me4MJGTcKgA)
[![Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-00F5D4)](https://stellar.expert/explorer/testnet/contract/CAPKM3CCICBB3FMTUWX6KQFG5NF3D4XOF2MAV7PKTRI4HMQSJ2H4YFI7)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20passing-05D5A1)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-gray)](LICENSE)

---

## What is MongliPool?

MongliPool is a **privacy pool** on Stellar that breaks the public link between deposits and withdrawals using **Zero-Knowledge Proofs** (Groth16/BN254), while maintaining regulatory compliance through an **Authorized Set Provider (ASP)** and **selective audit via asymmetric view keys** (NaCl box / Curve25519).

> Think of it as a communal vault: you deposit through one door and withdraw through another. Nobody can tell both doors are yours — but an authorized auditor can verify everything is legitimate when required.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER                                                      │
│  secret + nullifierSecret ──► Poseidon hash ──► commitment    │
│                            └──► snarkjs Groth16 WASM (~30s)  │
│  receipt (local only) ◄── encrypted with DAO public key       │
└──────────────────────┬───────────────────────────────────────┘
                       │  Freighter wallet → Stellar Testnet
          ┌────────────▼────────────┐
          │  privacy_pool           │  Soroban / Rust
          │  deposit(commitment)    │  Merkle tree (depth 20)
          │  withdraw(zk_proof)     │  Poseidon hash on-chain
          └───┬──────────┬──────────┘
              │          │
   ┌──────────▼──┐  ┌───▼─────────────┐
   │ groth16      │  │ asp_registry    │
   │ verifier     │  │ approve/deny    │
   │ BN254 pairing│  │ allowlist       │
   └──────────────┘  └─────────────────┘
```

**Flow:** Deposit → ZK proof generated in browser (21,781 constraints) → Proof verified on-chain with BN254 pairing → Funds sent to any address → Double-spend prevented by nullifier

---

## Demo Video

[![MongliPool Demo](https://img.youtube.com/vi/Me4MJGTcKgA/maxresdefault.jpg)](https://youtu.be/Me4MJGTcKgA)

**[▶ Watch the full demo on YouTube](https://youtu.be/Me4MJGTcKgA)** — Deposit, ZK proof generation, withdrawal, and auditor panel in action.

---

## Live Demo

**Frontend:** [mongli-pool.vercel.app](https://mongli-pool.vercel.app)

| Contract | Testnet ID |
|----------|-----------|
| Privacy Pool | [`CAPKM3CC...YFI7`](https://stellar.expert/explorer/testnet/contract/CAPKM3CCICBB3FMTUWX6KQFG5NF3D4XOF2MAV7PKTRI4HMQSJ2H4YFI7) |
| ASP Registry | [`CCVH3IBN...QIHX`](https://stellar.expert/explorer/testnet/contract/CCVH3IBNL7TJHWTG4DC2F6ZPLHK4J2UZGUT3VCJRQGKCZTWXHTMOQIHX) |
| Groth16 Verifier | [`CAXRVY3I...U5LZ`](https://stellar.expert/explorer/testnet/contract/CAXRVY3IUC2WEKOCHWVJBYMARKHCULKY77WL3E3UJIAGY3G6SHNFU5LZ) |

### Try it yourself
1. Install [Freighter](https://freighter.app) → connect to Testnet
2. Get test XLM from [friendbot](https://friendbot.stellar.org)
3. Open [mongli-pool.vercel.app](https://mongli-pool.vercel.app) → connect wallet
4. Deposit any amount (1-1000 XLM) → save your receipt
5. Withdraw → paste receipt → wait ~30s for ZK proof → confirm

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ZK Circuit | Circom 2.1.6 — Groth16 / BN254, 21,781 constraints |
| Proof Generation | snarkjs WASM (browser, ~30s single-thread) |
| Smart Contracts | Soroban (Rust) — `soroban_sdk::crypto::bn254` native pairing |
| View Key | NaCl box (Curve25519) — asymmetric, ephemeral keypair per deposit |
| Hash Function | Poseidon — ZK-friendly, used in Merkle tree (depth 20) |
| Frontend | React 18 + Vite + TypeScript + TailwindCSS + Three.js |
| Wallet | Freighter via @creit.tech/stellar-wallets-kit |
| Deploy | Vercel (frontend) + Stellar Testnet (contracts) |

---

## What's Real vs. Simplified

| Feature | Status | Notes |
|---------|--------|-------|
| ZK Proof (Groth16/BN254) | ✅ Real | Generated in browser, verified on-chain |
| On-chain verification | ✅ Real | BN254 pairing in Soroban contract |
| Merkle tree (Poseidon) | ✅ Real | Depth 20, synced between frontend and contract |
| Double-spend prevention | ✅ Real | Nullifier registered on-chain |
| ASP compliance | ✅ Real | Contract validates ASP root before ZK verification |
| Asymmetric view key | ✅ Real | NaCl box (Curve25519), ephemeral keypair per deposit |
| Variable amounts | ✅ Real | 1-1000 XLM per deposit |
| Trusted setup | ⚠️ Local | Standard for ZK prototypes (Tornado Cash, Zcash started the same way) |
| Root updates | ⚠️ Permissionless | Production: on-chain Merkle or trusted relayer |
| Circuit audit | ⚠️ Pending | Required before mainnet deployment |

Full security analysis: [SECURITY_AUDIT.md](SECURITY_AUDIT.md)

---

## Local Development

```bash
git clone https://github.com/ALFA117/MongliPool
cd MongliPool

# Frontend
cd frontend && npm install && npm run dev

# Contracts
cargo test                                        # 18/18 tests
cargo build --target wasm32v1-none --release      # 3 WASM contracts

# Circuit (only if modifying withdraw.circom)
cd circuits && circom withdraw.circom --r1cs --wasm --sym
```

---

## Security

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for the full vulnerability assessment (12 items documented, from trusted setup to infrastructure).

---

## Credits

Built by **- A L F A -** / **Mongli DAO** for **Stellar Hacks: ZK**.

Inspired by [Privacy Pools](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364) (Buterin et al., 2023) — the idea of combining privacy with ASP compliance comes directly from that paper.

- [Stellar Foundation](https://stellar.org) — Soroban SDK with native BN254 pairing
- [iden3](https://iden3.io) — Circom and snarkjs
- [PSE](https://pse.dev) — Privacy pool design references

---

**[@ALFA_EDG_](https://instagram.com/ALFA_EDG_)** · [GitHub](https://github.com/ALFA117/MongliPool) · [Live Demo](https://mongli-pool.vercel.app)
