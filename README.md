# MongliPool

**Private transfers on Stellar — with compliance built in.**

[![Stellar Hacks: ZK](https://img.shields.io/badge/Hackathon-Stellar%20Hacks%3A%20ZK-7C3AED)](https://dorahacks.io/hackathon/stellar-hacks-zk)
[![Live Demo](https://img.shields.io/badge/Demo-frontend--ebon--xi--57.vercel.app-10B981)](https://frontend-ebon-xi-57.vercel.app)
[![Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-3B82F6)](https://stellar.expert/explorer/testnet/contract/CAPKM3CCICBB3FMTUWX6KQFG5NF3D4XOF2MAV7PKTRI4HMQSJ2H4YFI7)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray)](LICENSE)

---

## ¿Qué es MongliPool?

MongliPool es un **pool de privacidad** en la blockchain de Stellar: te permite depositar fondos y luego retirarlos a cualquier dirección, sin que nadie pueda ver que las dos transacciones están relacionadas. Es como pagar en efectivo, pero en digital.

**¿Cómo funciona sin magia?** Cuando depositas, el contrato registra un *compromiso matemático* (un hash de tu secreto, no tu dirección). Cuando retiras, demuestras criptográficamente que conoces el secreto detrás de algún compromiso en el pool, sin revelar cuál. Esta técnica se llama *prueba de conocimiento cero* (Zero-Knowledge Proof), y es verificada directamente por el contrato en Stellar.

**¿Por qué "con cumplimiento"?** MongliPool incluye un **ASP (Authorized Set Provider)** — un registro de direcciones aprobadas por la DAO. Solo los usuarios en la lista blanca pueden retirar fondos. Esto permite privacidad real sin abrir la puerta al lavado de dinero: hay un actor responsable (Mongli DAO) que aprueba quién puede participar, y un **auditor con view key** que puede ver qué se depositó si la regulación lo exige.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│  USUARIO (browser)                                                  │
│                                                                     │
│  secret, nullifierSecret ──► Poseidon hash ──► commitment           │
│                          │                                          │
│                          └──► snarkjs (Groth16 WASM)               │
│                                    │ ZK proof (~30s, single-thread) │
│                                    ▼                                │
│             receipt (secreto local) ◄── cifrado con DAO view key   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  Freighter wallet → Stellar Testnet
                 ┌────────────▼────────────┐
                 │  privacy_pool           │  Soroban / Rust
                 │  deposit(commitment,    │
                 │          note)          │  Merkle tree (depth 20)
                 │  withdraw(proof,        │  Poseidon hash on-chain
                 │           nullifier,...)│
                 └───┬──────────┬──────────┘
                     │          │
          ┌──────────▼──┐  ┌───▼─────────────┐
          │ groth16_     │  │ asp_registry    │
          │ verifier     │  │                 │
          │              │  │ approve(addr)   │
          │ BN254 pairing│  │ deny(addr)      │
          │ on-chain     │  │ is_member(addr) │
          └──────────────┘  └─────────────────┘
                                    │
                              ┌─────▼──────┐
                              │ Mongli DAO  │
                              │ (auditor)   │
                              │ view key →  │
                              │ decrypt all │
                              │ notes       │
                              └─────────────┘
```

**Flujo completo:**

1. **Depositar** — El usuario genera un `secret` y `nullifierSecret` en el browser (nunca salen del dispositivo). Se calcula un `commitment = Poseidon(secret, nullifierSecret, amount)` y se envía al contrato junto con la nota cifrada con la view key del auditor.

2. **Actualizar raíces** — El admin (Mongli DAO) llama a `update_root` y `update_asp_root` para que el árbol de Merkle del contrato refleje el nuevo depósito.

3. **Retirar** — El usuario carga su recibo, el browser genera una prueba ZK (Groth16) que demuestra: (a) conoce el secreto de algún depósito en el árbol, (b) su dirección está en el ASP, (c) el nullifier no fue usado antes. El contrato verifica la prueba on-chain con pairing BN254.

---

## Demo en vivo

**Frontend:** [https://mongli-pool.vercel.app](https://mongli-pool.vercel.app)

**Contratos en Stellar Testnet:**

| Contrato | ID |
|----------|-----|
| PrivacyPool | [`CAPKM3CCICBB3FMTUWX6KQFG5NF3D4XOF2MAV7PKTRI4HMQSJ2H4YFI7`](https://stellar.expert/explorer/testnet/contract/CAPKM3CCICBB3FMTUWX6KQFG5NF3D4XOF2MAV7PKTRI4HMQSJ2H4YFI7) |
| ASPRegistry | [`CCVH3IBNL7TJHWTG4DC2F6ZPLHK4J2UZGUT3VCJRQGKCZTWXHTMOQIHX`](https://stellar.expert/explorer/testnet/contract/CCVH3IBNL7TJHWTG4DC2F6ZPLHK4J2UZGUT3VCJRQGKCZTWXHTMOQIHX) |
| Groth16Verifier | [`CAXRVY3IUC2WEKOCHWVJBYMARKHCULKY77WL3E3UJIAGY3G6SHNFU5LZ`](https://stellar.expert/explorer/testnet/contract/CAXRVY3IUC2WEKOCHWVJBYMARKHCULKY77WL3E3UJIAGY3G6SHNFU5LZ) |
| XLM SAC (token) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

**E2E verificado via CLI:**
```
deposit (10 XLM) → update_root → update_asp_root → withdraw con prueba ZK real → double-spend rechazado ✅
```

**Para probar en el browser:**
1. Instala [Freighter](https://freighter.app) y conecta a Testnet.
2. Usa tu propia cuenta (pide XLM en [friendbot](https://friendbot.stellar.org)) o importa la cuenta demo.
3. Abre [https://mongli-pool.vercel.app](https://mongli-pool.vercel.app), conecta wallet.
4. Ve a Depositar, deposita 10 XLM (se te pedirán 3 firmas: depósito + sincronizar árbol + registrar en ASP).
5. **Guarda el recibo** — es la única forma de retirar.
6. Ve a Retirar, pega el recibo, pon la dirección destino, espera ~30s para la prueba ZK, confirma.

---

## Cómo correrlo localmente

**Requisitos:** Node.js 20+, Rust + `wasm32v1-none` target, Stellar CLI, circom 2.1.6, snarkjs.

```bash
git clone https://github.com/ALFA117/MongliPool
cd MongliPool

# Frontend
cd frontend
npm install
cp .env.example .env   # o copia frontend/.env del repo
npm run dev             # http://localhost:5173

# Contratos (compilar)
cd contracts/groth16-verifier
cargo build --target wasm32v1-none --release
# (igual para privacy-pool y asp-registry)

# Tests
cargo test

# Circuito ZK (solo si modificas withdraw.circom)
cd circuits
circom withdraw.circom --r1cs --wasm --sym
node ../node_modules/snarkjs/build/cli.cjs groth16 setup withdraw.r1cs pot15_final.ptau withdraw_0000.zkey
# ... (ver scripts/ para la ceremonia completa)
```

**Variables de entorno necesarias** (ya en `frontend/.env`):
```
VITE_POOL_CONTRACT_ID=CAPKM3CCICBB3FMTUWX6KQFG5NF3D4XOF2MAV7PKTRI4HMQSJ2H4YFI7
VITE_ASP_CONTRACT_ID=CCVH3IBNL7TJHWTG4DC2F6ZPLHK4J2UZGUT3VCJRQGKCZTWXHTMOQIHX
VITE_VERIFIER_CONTRACT_ID=CAXRVY3IUC2WEKOCHWVJBYMARKHCULKY77WL3E3UJIAGY3G6SHNFU5LZ
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK=Test SDF Network ; September 2015
VITE_ADMIN_ADDRESS=GALJ6O2J66XUEBXXJBWCB2KXNFOCMBLIUF4NBXQZRYC3IWBJK7C6O2V3
```

---

## Qué es real vs. qué es MVP/simplificado

Esta sección es intencional. MongliPool es un prototipo de hackathon. Antes de usarlo con fondos reales, hay que entender sus limitaciones honestamente:

### ✅ Lo que sí es real

| Componente | Estado |
|------------|--------|
| Prueba ZK Groth16 | Real — se genera en el browser con snarkjs WASM |
| Verificación on-chain | Real — BN254 pairing ejecutado por el contrato Soroban |
| Árbol de Merkle Poseidon | Real — depth 20, mismo en frontend y contrato |
| Doble gasto imposible | Real — nullifier se registra en el contrato |
| ASP allowlist | Real — contrato verifica la raíz del ASP antes del ZK |
| Cifrado del recibo | Real — NaCl secretbox |
| Contratos en testnet | Real — deployados, inicializados, E2E verificado |

### ⚠ Lo que es MVP o simplificado

**1. Trusted setup local (crítico)**
La ceremonia de generación del `.zkey` se hizo en local con una sola contribución (`snarkjs zkey contribute`), sin participantes externos. En producción, un sistema ZK requiere una ceremonia MPC pública donde múltiples participantes garantizan que nadie conoce el "toxic waste" de la ceremonia. Si alguien tiene el toxic waste, puede fabricar pruebas falsas y robar fondos del pool.

**2. View key asimétrica (NaCl box / Curve25519)**
El cifrado del auditor usa NaCl box asimétrico: la clave pública del DAO está embebida en el frontend, y cada depósito cifra con un keypair efímero único. Solo la clave privada del DAO (gestionada offline) puede descifrar. Mejora futura: multisig M-de-N para que ningún miembro del DAO pueda descifrar solo.

**3. ASP tree == Pool tree (simplificación de diseño)**
En el frontend, el árbol de Merkle del ASP es el mismo que el del pool (la raíz del pool se usa también como raíz del ASP). Un diseño real separa ambos árboles: el ASP gestiona su propia lista de direcciones autorizadas de forma independiente.

**4. Actualización de raíces sin permisos (simplificación MVP)**
En el MVP, `update_root` y `update_asp_root` son funciones permisionless — cualquier usuario puede llamarlas. Esto permite que el frontend sincronice automáticamente después de cada depósito sin depender de un admin. En producción, esto se reemplazaría por un árbol de Merkle calculado dentro de `deposit()` on-chain, o por un relayer de confianza con pruebas de fraude.

**5. Monto variable 1–1000 XLM (testnet)**
El contrato acepta depósitos de entre 1 y 1000 XLM. El monto se incluye como input público del circuito ZK y se verifica on-chain. En producción, se soportarían múltiples assets y denominaciones más amplias.

**6. Sin auditoría del circuito**
El circuito `withdraw.circom` no fue auditado por terceros. Podría tener vulnerabilidades de under-constraint que permitan pruebas inválidas.

**7. Tiempo de generación de prueba ~30 segundos**
Sin las cabeceras COOP/COEP en la página principal (necesarias para no romper Freighter/WalletConnect), snarkjs corre en modo single-thread y la generación toma ~30 segundos. Con `crossOriginIsolated=true` bajaría a ~5 segundos con Workers WASM multi-thread.

---

## Stack técnico

**ZK / Criptografía:**
- [Circom 2.1.6](https://docs.circom.io/) — lenguaje de circuitos ZK
- [snarkjs](https://github.com/iden3/snarkjs) — generación de pruebas Groth16 en browser (WASM)
- BN254 (alt_bn128) — curva elíptica para el pairing
- Poseidon hash — función de hash ZK-friendly para Merkle tree

**Blockchain / Contratos:**
- [Stellar Soroban](https://soroban.stellar.org/) — plataforma de contratos inteligentes
- Rust + `wasm32v1-none` — target de compilación para Soroban SDK v25
- `soroban_sdk::crypto::bn254` — pairing BN254 nativo en el SDK

**Frontend:**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [TailwindCSS](https://tailwindcss.com/) — estilos
- [stellar-sdk](https://github.com/stellar/js-stellar-sdk) — interacción con Stellar RPC
- [@creit.tech/stellar-wallets-kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) — integración Freighter
- [three.js](https://threejs.org/) — visualizador 3D del pool (lazy-loaded)
- [tweetnacl](https://tweetnacl.js.org/) — cifrado NaCl para notas

**Deploy:**
- [Vercel](https://vercel.com/) — frontend
- [Stellar Testnet](https://developers.stellar.org/) — contratos

---

## Créditos

Construido por **Mongli DAO** para el hackathon **Stellar Hacks: ZK**.

Inspirado en [Tornado Cash](https://tornado.cash/) y [Privacy Pools](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364) (Buterin et al., 2023) — la idea de combinar privacidad con ASP/compliance viene directamente de ese paper.

Agradecimientos a:
- Stellar Foundation — por el SDK de Soroban con pairing BN254 real
- iden3 — por Circom y snarkjs
- PSE (Privacy & Scaling Explorations) — por las referencias de diseño de privacy pools

---

*Este código es un prototipo educativo. No usar con fondos reales hasta completar auditoría de seguridad.*