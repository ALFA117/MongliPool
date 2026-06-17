# MongliPool — Progress Tracker

**Hackathon:** Stellar Hacks: ZK (DoraHacks)
**Deadline:** 29 de junio de 2025
**Objetivo:** Primer lugar ($5000 XLM)

---

## Estado general: ~95% — Deploy testnet ✅, Vercel ✅, README ✅, video script ✅, pendiente E2E browser + grabar video + submit

---

---

## Deploy testnet — Contratos en vivo (2026-06-16)

### Contract IDs (Stellar Testnet)

| Contrato | Contract ID | Stellar Expert |
|----------|-------------|----------------|
| `groth16-verifier` | `CAXRVY3IUC2WEKOCHWVJBYMARKHCULKY77WL3E3UJIAGY3G6SHNFU5LZ` | [ver](https://stellar.expert/explorer/testnet/contract/CAXRVY3IUC2WEKOCHWVJBYMARKHCULKY77WL3E3UJIAGY3G6SHNFU5LZ) |
| `asp-registry` | `CADASIHQGQ5LVVXEXBLMTXJJO7MSPXAF2QHADH4A7JYDRW2LGGGAZ653` | [ver](https://stellar.expert/explorer/testnet/contract/CADASIHQGQ5LVVXEXBLMTXJJO7MSPXAF2QHADH4A7JYDRW2LGGGAZ653) |
| `privacy-pool` | `CDGY6VEK6EOCNA2DIM2PCYQGUVOYHB4G76I6A65MRHQ6MUCXA5EHTSMN` | [ver](https://stellar.expert/explorer/testnet/contract/CDGY6VEK6EOCNA2DIM2PCYQGUVOYHB4G76I6A65MRHQ6MUCXA5EHTSMN) |
| Token (XLM SAC nativo) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | SAC nativo testnet |

**Deployer/Admin:** `GALJ6O2J66XUEBXXJBWCB2KXNFOCMBLIUF4NBXQZRYC3IWBJK7C6O2V3`

### E2E verificado vía CLI (sin browser) ✅

| Paso | Tx Hash | Resultado |
|------|---------|-----------|
| Deploy groth16-verifier | `ae3b711c...` | ✅ |
| `initialize(vk_bytes)` | `64b09b4f...` | ✅ VK de 836 bytes almacenada |
| Deploy asp-registry | `444f93b0...` | ✅ |
| `initialize(admin)` | `564b768b...` | ✅ |
| Deploy privacy-pool | `3afc1a36...` | ✅ |
| `initialize(token, verifier, asp, admin)` | `f17d24f6...` | ✅ |
| **`deposit(10 XLM)`** | `8d34296b...` | ✅ 10 XLM transferidos, commitment en leaf_index 0 |
| `update_root(newRoot)` | `9fe605a1...` | ✅ |
| `update_asp_root(newRoot)` | `c88c36d2...` | ✅ ASP root = pool root = `121d6ada...` |
| **`withdraw(proof)`** | `7d24ca65...` | ✅ **ZK proof verificado on-chain, 10 XLM devueltos** |
| Double-spend attempt | — | ✅ `nullifier already spent` — rechazado |

**Flujo deposit → ZK proof → withdraw: VERIFICADO EN TESTNET CON CONTRATOS REALES**

> La prueba ZK fue generada con `snarkjs groth16 fullprove` localmente, usando el circuito real
> `withdraw.circom` (depth=20), con los parámetros del depósito real en testnet.
> El pairing BN254 se ejecutó dentro del contrato Soroban en testnet.

### Bugs de integración encontrados (PASO 4)

| Bug | Dónde | Fix |
|-----|-------|-----|
| `GAAZI4TCR...` no es una dirección Stellar válida | `stellar.ts` `getCommitments()` / `getAspRoot()` — usada como cuenta dummy para simulateTransaction | Reemplazado por `SIM_ACCOUNT = import.meta.env.VITE_ADMIN_ADDRESS` |
| `tree.root` no existe | `Deposit.tsx` — `PoseidonMerkleTree` tiene `getRoot()` no `.root` | Corregido a `tree.getRoot()` |
| `Address` importado pero no usado en stellar.ts | Import innecesario después de refactor | Eliminado del import |
| `fromBase64` / `getAddress` importados pero no usados en Deposit.tsx | Imports residuales | Eliminados |

### Deploy Vercel ✅

**URL pública**: https://frontend-ebon-xi-57.vercel.app

Verificado:
- Main page: HTTP 200 ✅
- `/keys/withdraw.wasm`: HTTP 200, 2.54 MB, `application/wasm` ✅
- `/keys/withdraw_final.zkey`: HTTP 200, 9.99 MB ✅
- Contract IDs baked en el JS bundle de producción ✅
- COEP/COOP headers en `/keys/` (para WASM) ✅
- snarkjs usa single-thread si `crossOriginIsolated=false` — funciona, proof ~30s

Headers del main page: NO tiene COEP (intencionalmente — agregarlos rompería Freighter/WalletConnect).

### Cuentas testnet disponibles

| Alias | Address | Uso | Mnemónico |
|-------|---------|-----|-----------|
| `deployer` | `GALJ6O2J66XUEBXXJBWCB2KXNFOCMBLIUF4NBXQZRYC3IWBJK7C6O2V3` | Admin (update roots) + demo principal | `~/.config/stellar/identity/deployer.toml` |
| `demo-user` | `GCBLJDVD7ZJQHSKMFCTECRE364V7HU5QRM5TMZB6PSDS2GWGNQI4DZFU` | Usuario regular (solo deposit/withdraw) | `~/.config/stellar/identity/demo-user.toml` |

### Instrucciones de demo con Freighter

**Para el demo completo (flujo auto):**
1. Importa `deployer` en Freighter (mnemónico en `~/.config/stellar/identity/deployer.toml`)
2. En Freighter: configurar red testnet (Horizon: `https://horizon-testnet.stellar.org`, Soroban RPC: `https://soroban-testnet.stellar.org`)
3. Abre https://frontend-ebon-xi-57.vercel.app
4. Conecta wallet desde el botón → Freighter
5. Deposit 10 XLM → confirma en Freighter → el frontend auto-actualiza pool root + ASP root
6. Withdraw (pega el recibo) → prueba ZK genera en ~30s → confirma en Freighter
7. Fondos vuelven a deployer

**Para demo multi-usuario (demo-user deposita, admin actualiza raíces):**
1. Importa `demo-user` en Freighter
2. Deposita desde el frontend → el auto-update de roots NO se activa (no es admin)
3. Admin (tú) ejecuta desde CLI: `node scripts/admin_update_roots.js`
4. Vuelves al frontend → withdraw funciona

### Bugs de integración encontrados (PASO 4)

| Bug | Dónde | Fix |
|-----|-------|-----|
| `GAAZI4TCR...` no es una dirección Stellar válida | `stellar.ts` `getCommitments()` / `getAspRoot()` | Reemplazado por `SIM_ACCOUNT = VITE_ADMIN_ADDRESS` |
| `tree.root` no existe | `Deposit.tsx` — `PoseidonMerkleTree` tiene `getRoot()` | Corregido a `tree.getRoot()` |
| `Address` importado pero no usado | `stellar.ts` | Eliminado del import |
| `fromBase64` / `getAddress` sin usar | `Deposit.tsx` | Eliminados |
| Auto-update root usaba `ADMIN_ADDRESS` como sender pero el wallet conectado podría ser diferente | `Deposit.tsx` | Fix: solo auto-actualiza si `address === ADMIN_ADDRESS` |

### Scripts disponibles post-deploy

```bash
# Actualizar pool root + ASP root tras cada deposit (si wallet != admin)
node scripts/admin_update_roots.js

# Serializar VK para reinicializar verifier si es necesario
node scripts/vk_to_hex.js circuits/verification_key.json
```

---

## Inventario completo — Estado honesto (2026-06-16)

### Leyenda
- ✅ Completado — tiene test o verificación real que lo confirma
- 🟡 Parcial — funciona pero con simplificaciones MVP o falta test end-to-end real
- ❌ No iniciado o no funcional
- 🐛 Bug conocido / deuda técnica documentada

---

### FASE 1: Circuitos ZK

| Ítem | Estado | Notas |
|------|--------|-------|
| `withdraw.circom` — circuito diseñado | ✅ | depth=20, Groth16, 21,866 wires |
| Compilación del circuito | ✅ | 10,241 non-linear + 11,540 linear constraints |
| Trusted setup (PoT15 local) | ✅ | `pot15_final.ptau` + `withdraw_final.zkey` |
| Proof local verificado con snarkjs | ✅ | `snarkjs groth16 verify` → OK |
| ASP Merkle proof real en circuito | ✅ | `aspPathElements/aspPathIndices` usados en proof real; `aspProof.root === aspMerkleRoot` constrained |
| ZK artifacts en `frontend/public/keys/` | ✅ | `withdraw.wasm` (2.42 MB), `withdraw_final.zkey` (9.54 MB), `verification_key.json` |
| Trusted setup de producción | ❌ | PoT15 local es MVP — producción requiere ceremonia pública (Powers of Tau > 15 participantes) |
| Circuito auditado por terceros | ❌ | No auditado; hackathon MVP |

### FASE 2: Contratos Soroban

| Ítem | Estado | Notas |
|------|--------|-------|
| `groth16-verifier::initialize(vk)` | ✅ | 8/8 tests — incluyendo proof real de snarkjs |
| `groth16-verifier::verify(proof, inputs)` | ✅ | Pairing BN254 real con soroban-sdk v25 |
| Pairing Groth16 correcto: `e(-A,B)·e(α,β)·e(vk_x,γ)·e(C,δ)=1` | ✅ | Verificado E2E con proof real del circuito |
| Test E2E con proof REAL de snarkjs (no inventado) | ✅ | `PROOF_BYTES` generados por `proof_to_rust.js` |
| `privacy-pool::deposit()` | 🟡 | Lógica correcta; test de integración con token SAC real pendiente |
| `privacy-pool::withdraw()` con ZK real | ✅ | Test D-1: tokens transferidos con proof real ✅ |
| `recipient_field` binding anti-frontrunning | ✅ | `BytesN<32>` pasado a ZK verifier como public input [3] |
| Protección double-spend (nullifier) | ✅ | Test D-2: segundo retiro con mismo nullifier → panic ✅ |
| Validación `asp_root` contra ASP registry on-chain | ✅ | Test D-3: asp_root no registrado → panic "invalid asp root" antes de ZK ✅ |
| `asp-registry::approve/deny/update_asp_root` | ✅ | 5/5 tests |
| `asp-registry::is_approved(commitment)` | ✅ | Lógica aprobado+negado implementada |
| `privacy-pool::initialize()` con `asp_registry_id` | ✅ | Cross-contract call a `get_asp_roots_history` en withdraw |
| `cargo build --target wasm32v1-none --release` | ✅ | 3 WASMs generados (8.2/14/6.9 KB) |
| Deploy en testnet | ✅ | 3 contratos deployados e inicializados — ver IDs arriba |
| `env.events().publish()` deprecated warnings | 🐛 | Usar `#[contractevent]` macro — no es error, es warning |
| Manejo de roots history (pool y ASP) con historial | 🟡 | Implementado pero no hay test que valide root expirado |

**Tests actuales: 18/18 ✅** (5 asp-registry + 8 groth16-verifier + 5 privacy-pool)

### FASE 3: View Key / Auditoría

| Ítem | Estado | Notas |
|------|--------|-------|
| Schema de note: `secret || nullifierSecret || amount` | ✅ | 96 bytes, serialización implementada |
| `encryptNote / decryptNote` (NaCl secretbox) | ✅ | Implementado en `crypto.ts` |
| `encodeNote / decodeNote` | ✅ | Implementado |
| View key simétrica (secretbox) | 🟡 | MVP — producción debe ser asimétrica (pk DAO embed, sk solo auditor) |
| Panel de auditor — UI | 🟡 | UI construida; usa `getDepositEvents()` hardcodeado placeholder |
| Panel de auditor — conectado a eventos reales | 🟡 | `getDepositEvents()` llama RPC real; contrato desplegado pero no probado en browser |
| DAO view key real | ❌ | Placeholder `[1u8; 32]` en el frontend — producción requiere key management seguro |

### FASE 4: Frontend

| Ítem | Estado | Notas |
|------|--------|-------|
| Setup: React + Vite + TypeScript + TailwindCSS | ✅ | Configurado |
| Paleta de colores dark/violet/green | ✅ | Design tokens en `tailwind.config.js` |
| Navbar + Router | ✅ | Navegación funcional en código |
| WalletButton con Freighter | 🟡 | Código correcto; no probado con Freighter en vivo |
| Home page (hero, 3 pasos, analogía) | ✅ | UI completa |
| `PrivacyVisualizer3D` — componente three.js | ✅ | Lazy-loaded, fallback mobile estático, paleta correcta, `prefers-reduced-motion` |
| Deposit page — flujo completo UI | 🟡 | UI + lógica completa; auto-actualiza pool/ASP root tras deposit; pendiente browser |
| Withdraw page — UI + flujo ZK | 🟡 | UI + proof generation correcto; contratos conectados; pendiente browser |
| zkproof.ts — serialización proof | ✅ | Ambos bugs críticos corregidos (G2 order + decimal parsing); validado byte-for-byte |
| stellar.ts `withdraw()` — `recipient_field` | ✅ | Parámetro añadido; Withdraw.tsx actualizado |
| Status page con countdown | 🟡 | UI construida; datos hardcodeados |
| `npm install` ejecutado | ✅ | node_modules instalados |
| `npm run build` sin errores TS | ✅ | 0 errores TS, vite build 11.08s |
| Conectar a contract IDs reales en `.env` | ✅ | `.env` con los 3 contract IDs reales + admin address |
| Merkle tree reconstruido desde eventos reales | 🟡 | `getCommitments()` llama contrato real; verificado vía CLI; pendiente browser |
| Manejo de errores de red robusto | 🐛 | Básico — no hay retry, no hay timeout UI explícito |
| Diseño mobile responsive | 🟡 | TailwindCSS breakpoints presentes; no verificado en dispositivo real |

### FASE 5: Deploy y entrega

| Ítem | Estado | Notas |
|------|--------|-------|
| `cargo build --target wasm32v1-none --release` | ✅ | 3 WASMs compilados correctamente |
| Deploy contratos en testnet | ✅ | 3 contratos deployados e inicializados |
| Contract IDs en `.env` del frontend | ✅ | `.env` completo con IDs reales |
| E2E deposit→withdraw verificado | ✅ | Verificado vía CLI (ver tabla arriba) |
| `npm run build` + deploy Vercel | ✅ | Build 9.37s, URL: https://frontend-ebon-xi-57.vercel.app |
| README.md con arquitectura, diagramas | ✅ | Incluye sección "Real vs MVP" con 7 limitaciones honestas, diagrama ASCII, stack, créditos |
| Video demo script | ✅ | `VIDEO_SCRIPT.md` — 6 escenas, 2:50 min, narración + pasos en pantalla |
| Video demo grabado | ❌ | Guion listo, pendiente grabación con OBS/Loom |
| `progress.json` actualizado | ✅ | Contract IDs, percentages, Vercel URL reales |
| Submission en DoraHacks | ❌ | |
| E2E con browser + Freighter real | ❌ | Pendiente — importar deployer key en Freighter |

---

## Bugs conocidos / Deuda técnica

| Bug | Severidad | Estado |
|-----|-----------|--------|
| ~~`recipient_field` placeholder `[0u8;32]` en contrato~~ | CRÍTICO | ✅ RESUELTO |
| ~~G2 byte order real-first en `zkproof.ts`~~ | CRÍTICO | ✅ RESUELTO |
| ~~Decimal vs hex parsing en `encode32` de zkproof.ts~~ | CRÍTICO | ✅ RESUELTO |
| ~~`asp_root` no validado contra registry on-chain~~ | CRÍTICO | ✅ RESUELTO |
| ~~`stellar.ts withdraw()` sin `recipient_field`~~ | CRÍTICO | ✅ RESUELTO |
| View key simétrica (MVP) → debe ser asimétrica | MEDIO | 🟡 Documentado |
| `env.events().publish()` deprecation warnings | BAJO | 🐛 Warnings, no errores |
| Dummy read-only account en `getCommitments()/getAspRoot()` | BAJO | 🐛 Funciona con `simulateTransaction` |
| ASP tree == pool tree en frontend (MVP) | DISEÑO | 🟡 Documentado en código |
| No hay test de deposit() con token SAC real | MEDIO | ❌ Pendiente |
| `stellar.ts` usa `scvBytes` para `BytesN<32>` — puede requerir ajuste con ABI real | BAJO | 🐛 Verificar al conectar contrato real |

---

## Timeline restante — ~13 días hasta deadline (29 jun)

| Día | Tarea | Bloqueante para |
|-----|-------|-----------------|
| Hoy (16 jun) | ✅ ASP integrado y probado; ✅ 3D visualizer; ✅ `recipient_field` fix frontend | — |
| 17–18 jun | `npm install` + `npm run build` verificación TypeScript | Todo el frontend |
| 18–19 jun | `cargo build --target wasm32-unknown-unknown --release` — compilar contratos a WASM | Deploy |
| 19–20 jun | Deploy contratos en testnet (`stellar contract deploy`) | Integración real |
| 20–21 jun | Conectar frontend a contract IDs reales; prueba flujo completo deposit → withdraw | Demo |
| 21–23 jun | Prueba E2E completa con Freighter real; fix de bugs de integración | Demo |
| 23–25 jun | README.md con arquitectura, diagramas ZK, instrucciones de deploy | Submission |
| 25–27 jun | Grabación video demo 2-3 minutos | Submission |
| 27–28 jun | Submission en DoraHacks + revisión final | DEADLINE |
| 29 jun | **DEADLINE** | |

**Riesgo principal:** La integración frontend-contrato tiene muchos puntos de falla (serialización de ScVal, pollling de transacciones, manejo de errores de Freighter). El bloque 20-23 jun puede expandirse a 3-4 días fácilmente.

---

---

## Build results (2026-06-16)

### Contratos WASM — `cargo build --target wasm32v1-none --release` ✅

> Target correcto para soroban-sdk v25: `wasm32v1-none` (NO `wasm32-unknown-unknown` — ese falla desde Rust 1.82+ por reference-types/multi-value habilitados por defecto)

| Contrato | Tamaño WASM | Límite Soroban |
|----------|-------------|----------------|
| `asp_registry.wasm` | **8.2 KB** | 256 KB ✅ |
| `groth16_verifier.wasm` | **14 KB** | 256 KB ✅ |
| `privacy_pool.wasm` | **6.9 KB** | 256 KB ✅ |

Ubicación: `target/wasm32v1-none/release/*.wasm`
Warnings: 5 deprecation warnings por `env.events().publish()` — no son errores, no bloquean deploy.

### Frontend — `npm install && npm run build` ✅

**TypeScript: 0 errores** — build de producción limpio.

Bugs TS corregidos durante el build:
- `poseidon-lite`: `buildPoseidon` no existe en v0.2.1 → reemplazado con `poseidon1`/`poseidon2`/`poseidon3` (síncronos)
- `import.meta.env`: faltaba `src/vite-env.d.ts` con `/// <reference types="vite/client" />`
- `snarkjs`: sin tipos TS → creado `src/types/snarkjs.d.ts` con declaración manual
- `EventResponse.createdAt`: campo no existe → corregido a `new Date(e.ledgerClosedAt).getTime()`
- `StellarWalletsKit`: API v1.6.2 requiere `modules: [new FreighterModule()]` en el constructor
- `merkle.ts`: refactorizado a completamente síncrono (poseidon-lite es síncrono)

Chunks generados:
| Chunk | Tamaño (min) | Gzip | Nota |
|-------|-------------|------|------|
| `PrivacyVisualizer3D-*.js` | 466 kB | 118 kB | Lazy chunk ✅ (three.js aislado) |
| `snarkjs-*.js` | 280 kB | 59 kB | Chunk separado |
| `index-*.js` | 2,173 kB | 879 kB | ⚠️ Grande — Stellar SDK + WalletConnect |
| `index.css` | 21 kB | 5 kB | OK |

> El bundle principal (2.1 MB) es esperado para DeFi apps con Stellar SDK + WalletConnect.
> No impide el deploy en Vercel. Si se quiere optimizar: `manualChunks` para separar stellar-sdk.

### PASO 3 — Aclaraciones documentadas

#### View key simétrica — qué ES exactamente

```ts
// Deposit.tsx línea 19:
const DAO_VIEW_KEY = new Uint8Array(32).fill(1); // 0x0101...01
```

- Es una **clave de 32 bytes hardcodeada** en el código fuente, todos los bytes = 1
- **NO** proviene de una env var, **NO** es derivada de ningún secreto, **NO** cambia entre instancias
- La misma clave se usa para cifrar TODOS los notes de TODOS los usuarios
- Cualquiera que lea el source code puede descifrar todos los notes
- La documentación de la limitación está en el comentario de `Deposit.tsx` líneas 18-32

**Diseño de producción** (no implementado):
- Clave pública NaCl del DAO embebida en el frontend (puede ser pública)
- Depositor cifra el note TO esa clave pública
- Solo el DAO con su clave privada (offline, multisig) puede descifrar
- El auditor recibe la clave privada del DAO para su panel de auditoría

**Lo que falta para hacerlo real**: 1 keygen offline del DAO + sustituir `DAO_VIEW_KEY` por `nacl.box` con la pk del DAO.

#### ¿El test de deposit() bloquea el deploy a testnet? — **NO**

El test `deposit()` con token SAC real está incompleto, pero:
- `deposit()` es lógica simple: transferir tokens + guardar commitment + emitir evento
- Los tests de `withdraw()` (D-1 y D-2) ya cubren el token SAC real (mint directo al pool)
- El flujo de deposit se puede verificar interactivamente en testnet via el frontend
- No hay lógica condicional en `deposit()` que requiera cobertura de tests

**Prioridad antes de deploy**: NO (es deuda técnica, no bloqueante).

---

## Fase 1: Circuitos ZK `[100%]` — COMPLETO ✅

- [x] `withdraw.circom` diseñado (MerkleProof × 2 + Poseidon commitment + nullifier)
- [x] Circuito compilado: 10,241 non-linear + 11,540 linear constraints, 21,866 wires
- [x] Keys generadas: local PoT15 ceremony + zkey setup (`withdraw_final.zkey`)
- [x] Proof local verificado: `snarkjs groth16 verify` → OK
- [x] `proof_to_rust.js` — convierte snarkjs JSON → constantes Rust para tests
- [x] Test E2E en `groth16-verifier`: `initialize(VK)` → `verify(proof, inputs)` → true
- [x] ZK artifacts copiados a `frontend/public/keys/`

---

## Fase 2: Contratos Soroban `[95%]` — CASI COMPLETO ✅

**18/18 tests pasan — 0 errores**

- [x] `groth16-verifier`: pairing BN254 real, 8/8 tests con proof real de snarkjs
- [x] `privacy-pool`: deposit + withdraw + double-spend + ASP root validation, 5/5 tests
- [x] `asp-registry`: approve/deny/update_root, 5/5 tests
- [ ] `cargo build --target wasm32-unknown-unknown --release`
- [ ] Deploy en testnet

---

## Fase 3: View Key `[50%]` — IN PROGRESS

- [x] Esquema: NaCl secretbox (MVP — debe ser asimétrico en producción)
- [x] `encryptNote / decryptNote / encodeNote / decodeNote` en `crypto.ts`
- [ ] Panel de auditor conectado a eventos on-chain reales
- [ ] DAO view key real (actualmente placeholder `[1u8; 32]`)

---

## Fase 4: Frontend `[75%]` — IN PROGRESS

- [x] Setup completo: React + Vite + TypeScript + TailwindCSS
- [x] Wallet Freighter (código correcto, no probado en vivo)
- [x] Todas las páginas construidas: Home, Deposit, Withdraw, Auditor, Status
- [x] `zkproof.ts` — serialización correcta (bugs críticos resueltos y validados)
- [x] `stellar.ts` — API completa incluyendo `recipient_field`
- [x] `PrivacyVisualizer3D` — three.js, lazy-loaded, fallback mobile, `prefers-reduced-motion`
- [ ] `npm install` — deps no instaladas
- [ ] `npm run build` — TypeScript no verificado
- [ ] Conectar a contract IDs reales

---

## Fase 5: Deploy y entrega `[75%]` — EN PROGRESO

- [x] Compilar contratos a WASM (`wasm32v1-none`)
- [x] Deploy 3 contratos en testnet + inicializar
- [x] E2E deposit → ZK proof → withdraw verificado en testnet (CLI)
- [x] `npm run build` limpio con contract IDs reales en `.env`
- [x] Deploy Vercel → https://frontend-ebon-xi-57.vercel.app
- [ ] E2E browser con Freighter real (instrucciones documentadas, pendiente ejecución manual)
- [ ] README.md + video demo + submission

---

## Estructura de archivos

```
MongliPool/
├── Cargo.toml                          # Rust workspace
├── PROGRESS.md                         # Este archivo
├── contracts/
│   ├── groth16-verifier/               # Pairing BN254 real (8 tests ✅)
│   ├── privacy-pool/                   # deposit + withdraw + ASP validation (5 tests ✅)
│   └── asp-registry/                  # Allowlist on-chain (5 tests ✅)
├── circuits/
│   ├── withdraw.circom                 # Groth16, depth=20, ASP dual Merkle
│   ├── withdraw_final.zkey             # Local PoT15 ceremony
│   ├── verification_key.json
│   ├── proof.json / public.json        # Proof real generado por snarkjs
│   └── scripts/
│       ├── proof_to_rust.js            # Convierte proof.json → constantes Rust
│       └── validate_frontend_serialize.js  # Valida byte-for-byte con zkproof.ts
└── frontend/
    ├── public/keys/                    # withdraw.wasm (2.42 MB), withdraw_final.zkey (9.54 MB)
    └── src/
        ├── components/
        │   ├── Navbar.tsx
        │   ├── WalletButton.tsx
        │   └── PrivacyVisualizer3D.tsx # three.js, lazy-loaded ✅
        ├── lib/
        │   ├── crypto.ts               # Poseidon, encrypt/decrypt, field encoding
        │   ├── merkle.ts               # PoseidonMerkleTree (depth 20)
        │   ├── stellar.ts              # Soroban RPC — API completa con recipient_field ✅
        │   ├── wallet.ts               # Freighter / stellar-wallets-kit
        │   └── zkproof.ts              # Proof generation — serialización validada ✅
        └── pages/
            ├── Home.tsx                # 3D visualizer integrado con lazy load
            ├── Deposit.tsx
            ├── Withdraw.tsx            # Pasa recipient_field al contrato ✅
            ├── Auditor.tsx
            └── Status.tsx
```