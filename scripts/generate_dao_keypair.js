const nacl = require("tweetnacl");
const toHex = (bytes) => Buffer.from(bytes).toString("hex");

const keypair = nacl.box.keyPair();

console.log("=== MONGLI DAO KEYPAIR (NaCl box / Curve25519) ===");
console.log("");
console.log("PUBLIC KEY (embed in frontend code):");
console.log(toHex(keypair.publicKey));
console.log("");
console.log("PRIVATE KEY (keep offline, NEVER commit to git):");
console.log(toHex(keypair.secretKey));
console.log("");
console.log("WARNING: Save the PRIVATE KEY somewhere safe NOW.");
console.log("It cannot be recovered if lost.");
console.log("The public key will be embedded in the frontend.");
console.log("===================================================");
