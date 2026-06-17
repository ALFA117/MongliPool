# MongliPool — Proof & VK Byte Format Reference

This document is the authoritative reference for the binary serialization consumed
by `groth16-verifier::verify()` and `groth16-verifier::initialize()`. All byte
values are **big-endian** throughout. This must stay in sync with `zkproof.ts`
in the frontend.

---

## 1. Curve

BN254 (also known as alt_bn128), the default curve used by Circom/snarkjs.

- Base field prime **p** = `0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47`
- Scalar field prime **r** = `0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001`
- G1 and G2 points are serialized in **Ethereum-compatible uncompressed format** (same as EIP-197).

---

## 2. Point encodings

### G1 point — 64 bytes

```
[ 32 bytes: X coordinate, big-endian Fp ]
[ 32 bytes: Y coordinate, big-endian Fp ]
```

Point at infinity = 64 zero bytes.

### G2 point — 128 bytes

G2 coordinates are Fp2 elements: `A = A.c0 + A.c1·i`.  
Encoding is **imaginary-part first** (EIP-197 / Ethereum precompile convention):

```
[ 32 bytes: X.c1 (imaginary), big-endian Fp ]
[ 32 bytes: X.c0 (real),      big-endian Fp ]
[ 32 bytes: Y.c1 (imaginary), big-endian Fp ]
[ 32 bytes: Y.c0 (real),      big-endian Fp ]
```

Point at infinity = 128 zero bytes.

> ⚠️ snarkjs exports G2 coordinates in `[x[0], x[1]]` order where `x[0]` is the
> **real part** and `x[1]` is the **imaginary part**. The contract expects
> imaginary-first, so when converting from snarkjs output you must **swap**:
> `be(proof.pi_b[0][1]) || be(proof.pi_b[0][0]) || be(proof.pi_b[1][1]) || be(proof.pi_b[1][0])`

---

## 3. `proof_bytes` — 256 bytes

Passed as the first argument to `verify()`.

```
Offset   Size   Field   Description
──────   ────   ─────   ───────────────────────────────────────
0        64     A       G1 point  (snarkjs: proof.pi_a[0..1])
64       128    B       G2 point  (snarkjs: proof.pi_b — swap c0/c1, see §2)
192      64     C       G1 point  (snarkjs: proof.pi_c[0..1])
```

**snarkjs → bytes conversion for each G1 point:**
```ts
function g1ToBytes(p: string[]): Uint8Array {
    const x = hexToBytes32(BigInt(p[0]));
    const y = hexToBytes32(BigInt(p[1]));
    return concat(x, y);
}
```

**snarkjs → bytes conversion for the G2 point (B):**
```ts
function g2ToBytes(p: string[][]): Uint8Array {
    const xIm = hexToBytes32(BigInt(p[0][1]));  // X.c1 (imaginary)
    const xRe = hexToBytes32(BigInt(p[0][0]));  // X.c0 (real)
    const yIm = hexToBytes32(BigInt(p[1][1]));  // Y.c1 (imaginary)
    const yRe = hexToBytes32(BigInt(p[1][0]));  // Y.c0 (real)
    return concat(xIm, xRe, yIm, yRe);
}
```

**Full proof_bytes assembly:**
```ts
const proofBytes = concat(
    g1ToBytes(proof.pi_a),
    g2ToBytes(proof.pi_b),
    g1ToBytes(proof.pi_c)
);
// proofBytes.length === 256
```

---

## 4. `public_inputs` — Vec<BytesN<32>>, exactly 5 elements

Passed as the second argument to `verify()`.  
Each element is a **32-byte big-endian** encoding of a BN254 scalar field element.

The order must match the circuit's public signal declaration order
(see `circuits/withdraw.circom`, `component main`):

```
Index   Signal          Source
─────   ──────          ──────────────────────────────────────────────────
0       poolMerkleRoot  public.json[0] — current pool Merkle tree root
1       aspMerkleRoot   public.json[1] — current ASP Merkle tree root
2       nullifierHash   public.json[2] — Poseidon(nullifierSecret)
3       recipient       public.json[3] — recipient field element (see §5)
4       amountPub       public.json[4] — fixed deposit amount (10_000_000)
```

**Conversion from snarkjs public.json (array of decimal strings):**
```ts
function fieldToBytes32(decStr: string): Uint8Array {
    const n = BigInt(decStr);
    const buf = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return buf;
}
```

---

## 5. Recipient field element

`recipient` in the circuit is a **BN254 scalar field element** (0 ≤ r < scalar field modulus).  
It is derived from the Stellar recipient address using the same encoding as the frontend:

```ts
// In frontend/src/lib/crypto.ts → fieldEncodeAddress()
// Stellar address → raw 32-byte ed25519 public key → interpret as big-endian integer → reduce mod r
```

When calling `privacy-pool::withdraw()`, the caller passes `recipient_field: BytesN<32>`
(the pre-computed field element). The contract forwards it as public input [3] to the verifier.

> **MVP NOTE:** The current privacy-pool passes `[0u8; 32]` as a placeholder
> (see `contracts/privacy-pool/src/lib.rs` TODO). Fix before testnet deploy.

---

## 6. `vk_bytes` passed to `initialize()` 

```
Offset     Size         Field         Description
──────     ────         ─────         ───────────────────────────────
0          64           alpha_g1      G1 — from vk.vk_alpha_1
64         128          beta_g2       G2 — from vk.vk_beta_2
192        128          gamma_g2      G2 — from vk.vk_gamma_2
320        128          delta_g2      G2 — from vk.vk_delta_2
448        4            num_ic        u32 big-endian = len(vk.IC)
452        64 × num_ic  IC[0..n]      G1 array — from vk.IC[]
```

For our `Withdraw(20)` circuit: **num_ic = 6** (5 public inputs + 1 constant term).  
Minimum VK size = 452 + 6 × 64 = **836 bytes**.

**JS helper to build vk_bytes:**
```ts
// In frontend/src/lib/zkproof.ts
function serializeVK(vk: SnarkjsVK): Uint8Array {
    const parts: Uint8Array[] = [
        g1ToBytes(vk.vk_alpha_1),
        g2ToBytes(vk.vk_beta_2),
        g2ToBytes(vk.vk_gamma_2),
        g2ToBytes(vk.vk_delta_2),
        // num_ic as u32 big-endian
        new Uint8Array([0, 0, (vk.IC.length >> 8) & 0xff, vk.IC.length & 0xff]),
        // IC points
        ...vk.IC.map((p: string[]) => g1ToBytes(p)),
    ];
    return concat(...parts);
}
```

---

## 7. Groth16 verification equation (reference)

```
e(-A, B) · e(alpha, beta) · e(vk_x, gamma) · e(C, delta) = 1  in GT
```

where `vk_x = IC[0] + Σ(i=0..4) IC[i+1] · public_inputs[i]` (G1 scalar multiplication and addition).

---

## 8. Trusted setup note

The `verification_key.json` (and the `.zkey` from which it's derived) must come
from a trusted setup ceremony over the `withdraw.circom` R1CS.

**For this hackathon MVP:** A local ceremony was run with snarkjs (`powersoftau new bn128 15`).
This is NOT safe for production — a single party knows the toxic waste.
For production: use a multi-party computation ceremony (e.g., Hermez/PSE perpetual PoT).

The ptau file used: `circuits/pot15_final.ptau` (local ceremony, 2^15 = 32,768 constraints capacity).