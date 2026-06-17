#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Bytes, BytesN, Env, Vec, token,
};

const MAX_ROOTS_HISTORY: u32 = 100;
const DEPOSIT_AMOUNT: i128 = 10_000_000; // 10 USDC (7 decimals)

#[contracttype]
pub enum DataKey {
    Commitments,
    Nullifiers,
    RootsHistory,
    CurrentRoot,
    TokenId,
    VerifierContractId,
    AspRegistryId,
    Admin,
    DepositCount,
}

#[contracttype]
#[derive(Clone)]
pub struct DepositEvent {
    pub commitment: BytesN<32>,
    pub encrypted_note: Bytes,
    pub leaf_index: u32,
}

#[contract]
pub struct PrivacyPool;

#[contractimpl]
impl PrivacyPool {
    /// Initialize the pool with a token, verifier contract, ASP registry, and admin.
    pub fn initialize(
        env: Env,
        token_id: Address,
        verifier_id: Address,
        asp_registry_id: Address,
        admin: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenId, &token_id);
        env.storage().instance().set(&DataKey::VerifierContractId, &verifier_id);
        env.storage().instance().set(&DataKey::AspRegistryId, &asp_registry_id);
        env.storage().instance().set(&DataKey::DepositCount, &0u32);

        let empty_commitments: Vec<BytesN<32>> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Commitments, &empty_commitments);

        let empty_roots: Vec<BytesN<32>> = Vec::new(&env);
        env.storage().instance().set(&DataKey::RootsHistory, &empty_roots);
    }

    /// Deposit tokens into the pool with a commitment.
    /// The commitment = Poseidon(secret, nullifierSecret, amount) computed client-side.
    pub fn deposit(env: Env, depositor: Address, commitment: BytesN<32>, encrypted_note: Bytes) {
        depositor.require_auth();

        // Transfer fixed amount from depositor to contract
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&depositor, &env.current_contract_address(), &DEPOSIT_AMOUNT);

        // Store commitment
        let mut commitments: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::Commitments)
            .unwrap_or(Vec::new(&env));

        let leaf_index = commitments.len();
        commitments.push_back(commitment.clone());
        env.storage().instance().set(&DataKey::Commitments, &commitments);

        // Update deposit count
        let count: u32 = env.storage().instance().get(&DataKey::DepositCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::DepositCount, &(count + 1));

        // Emit deposit event — frontend listens to reconstruct Merkle tree
        env.events().publish(
            (symbol_short!("deposit"), commitment.clone()),
            DepositEvent {
                commitment,
                encrypted_note,
                leaf_index,
            },
        );
    }

    /// Withdraw from the pool by providing a valid ZK proof.
    ///
    /// `recipient_field` is the BN254 scalar-field encoding of the recipient's
    /// Stellar address (computed off-chain and bound to the proof). It must match
    /// the field element used when the proof was generated, or verification fails.
    pub fn withdraw(
        env: Env,
        proof: Bytes,
        merkle_root: BytesN<32>,
        asp_root: BytesN<32>,
        nullifier_hash: BytesN<32>,
        recipient: Address,
        recipient_field: BytesN<32>,
        amount: i128,
    ) {
        // Validate amount matches fixed deposit amount
        if amount != DEPOSIT_AMOUNT {
            panic!("invalid amount");
        }

        // Check merkle_root is in history
        let roots: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::RootsHistory)
            .unwrap_or(Vec::new(&env));

        let mut root_valid = false;
        for i in 0..roots.len() {
            if roots.get(i).unwrap() == merkle_root {
                root_valid = true;
                break;
            }
        }
        if !root_valid {
            panic!("invalid merkle root");
        }

        // Check nullifier not already spent (double-spend protection)
        let nullifier_key = DataKey::Nullifiers;
        let mut nullifiers: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&nullifier_key)
            .unwrap_or(Vec::new(&env));

        for i in 0..nullifiers.len() {
            if nullifiers.get(i).unwrap() == nullifier_hash {
                panic!("nullifier already spent");
            }
        }

        // Validate asp_root against on-chain ASP registry history.
        // Without this check, anyone could fabricate a custom ASP tree and bypass compliance.
        let asp_registry_id: Address = env
            .storage()
            .instance()
            .get(&DataKey::AspRegistryId)
            .unwrap();
        let asp_root_history: Vec<BytesN<32>> = env.invoke_contract(
            &asp_registry_id,
            &soroban_sdk::Symbol::new(&env, "get_asp_roots_history"),
            soroban_sdk::vec![&env],
        );
        let mut asp_root_valid = false;
        for i in 0..asp_root_history.len() {
            if asp_root_history.get(i).unwrap() == asp_root {
                asp_root_valid = true;
                break;
            }
        }
        if !asp_root_valid {
            panic!("invalid asp root");
        }

        // Build public inputs for the verifier
        // [poolMerkleRoot, aspMerkleRoot, nullifierHash, recipient_field, amountPub]
        let mut public_inputs: Vec<BytesN<32>> = Vec::new(&env);
        public_inputs.push_back(merkle_root.clone());
        public_inputs.push_back(asp_root.clone());
        public_inputs.push_back(nullifier_hash.clone());

        // Recipient field element: precomputed by the caller (same value used in
        // the proof generation). The verifier enforces the binding cryptographically.
        public_inputs.push_back(recipient_field);

        // Encode amount as bytes32 (big-endian i128)
        let mut amount_field = [0u8; 32];
        let amount_bytes = amount.to_be_bytes();
        for (i, b) in amount_bytes.iter().enumerate() {
            amount_field[16 + i] = *b;
        }
        public_inputs.push_back(BytesN::from_array(&env, &amount_field));

        // Call groth16 verifier
        let verifier_id: Address = env
            .storage()
            .instance()
            .get(&DataKey::VerifierContractId)
            .unwrap();

        let verified: bool = env.invoke_contract(
            &verifier_id,
            &symbol_short!("verify"),
            soroban_sdk::vec![
                &env,
                proof.to_val(),
                public_inputs.to_val(),
            ],
        );

        if !verified {
            panic!("invalid proof");
        }

        // Mark nullifier as spent
        nullifiers.push_back(nullifier_hash.clone());
        env.storage().instance().set(&nullifier_key, &nullifiers);

        // Transfer tokens to recipient
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&env.current_contract_address(), &recipient, &DEPOSIT_AMOUNT);

        // Emit withdrawal event
        env.events().publish(
            (symbol_short!("withdraw"), nullifier_hash),
            (recipient, amount),
        );
    }

    /// Called by off-chain indexer after each deposit to store the new Merkle root.
    /// In production: replace with on-chain Merkle tree update (more expensive).
    pub fn update_root(env: Env, new_root: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut roots: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::RootsHistory)
            .unwrap_or(Vec::new(&env));

        roots.push_back(new_root.clone());

        // Keep history bounded
        if roots.len() > MAX_ROOTS_HISTORY {
            roots.pop_front_unchecked();
        }

        env.storage().instance().set(&DataKey::RootsHistory, &roots);
        env.storage().instance().set(&DataKey::CurrentRoot, &new_root);
    }

    // --- View functions ---

    pub fn get_commitments(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::Commitments)
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_roots_history(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::RootsHistory)
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_current_root(env: Env) -> Option<BytesN<32>> {
        env.storage().instance().get(&DataKey::CurrentRoot)
    }

    pub fn get_pool_balance(env: Env) -> i128 {
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        token_client.balance(&env.current_contract_address())
    }

    pub fn get_deposit_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::DepositCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Bytes, BytesN, Env};
    #[allow(unused_imports)]
    use groth16_verifier;
    #[allow(unused_imports)]
    use asp_registry;

    // -----------------------------------------------------------------------
    // Real ZK artifacts from circuits/scripts/proof_to_rust.js
    // Circuit: withdraw.circom (Withdraw(depth=20)), 5 public inputs
    // snarkjs local verify returned OK
    // -----------------------------------------------------------------------

    #[allow(clippy::unreadable_literal)]
    const PROOF_BYTES: [u8; 256] = [
        0x27, 0x42, 0xa8, 0xe0, 0x38, 0xc6, 0x06, 0x24, 0x9f, 0x2f, 0x9e, 0x5d, 0x09, 0xcc, 0x91, 0x24,
        0x61, 0x57, 0xc4, 0xa3, 0xe8, 0x9a, 0x22, 0xce, 0xdc, 0xc5, 0x57, 0x95, 0x46, 0xd3, 0x10, 0xb0,
        0x1d, 0x8f, 0x9f, 0x52, 0xbc, 0x63, 0x4d, 0x8d, 0x73, 0x00, 0x8e, 0x82, 0x21, 0x07, 0x38, 0xc5,
        0x19, 0x7f, 0xa2, 0x6d, 0x8e, 0x55, 0xf0, 0x48, 0x1b, 0x94, 0xd5, 0xa8, 0xed, 0xba, 0xbd, 0x74,
        0x0a, 0xd0, 0xe5, 0x56, 0xfe, 0xf3, 0x4f, 0x50, 0x5d, 0x4b, 0x0f, 0x9e, 0x55, 0xcb, 0xda, 0x84,
        0x1e, 0xd5, 0x52, 0x54, 0x50, 0x86, 0xaa, 0x65, 0x26, 0x65, 0x31, 0x22, 0xf5, 0x14, 0x43, 0x00,
        0x13, 0x18, 0x04, 0xe2, 0x3f, 0x3b, 0xab, 0x3a, 0xe3, 0x2d, 0x97, 0x90, 0x92, 0xcf, 0x28, 0x20,
        0xc2, 0xf2, 0xe0, 0xda, 0x79, 0xfe, 0x97, 0x70, 0xf7, 0xf4, 0x1d, 0xc6, 0x4e, 0x9e, 0x55, 0x24,
        0x02, 0xa7, 0x98, 0xa3, 0xe5, 0x18, 0x4b, 0xeb, 0xaa, 0x29, 0x64, 0x85, 0xc8, 0xe2, 0xb2, 0x6f,
        0x77, 0xcd, 0x74, 0x29, 0x20, 0x01, 0x6c, 0xa8, 0x17, 0xc5, 0xf6, 0x60, 0x63, 0x95, 0xc5, 0xb6,
        0x2f, 0x6c, 0xe2, 0xd7, 0x73, 0xdb, 0xed, 0x01, 0x77, 0x3c, 0x0f, 0x04, 0xbf, 0x78, 0xd9, 0xcd,
        0x09, 0x82, 0x22, 0xa2, 0x12, 0x95, 0x4a, 0x38, 0x07, 0x6c, 0x71, 0xda, 0x72, 0x12, 0x07, 0x46,
        0x00, 0x29, 0xda, 0x96, 0x6c, 0x76, 0x00, 0xc8, 0x51, 0x85, 0x18, 0xac, 0x7e, 0xe5, 0xa7, 0xcf,
        0xf5, 0xbf, 0xd0, 0xd4, 0xec, 0xd5, 0xe2, 0x3a, 0x45, 0x03, 0x82, 0xc2, 0xf9, 0x8a, 0x91, 0x8d,
        0x28, 0x7c, 0x25, 0x1d, 0x87, 0xba, 0xf5, 0xe7, 0xb5, 0x24, 0x0c, 0x03, 0xdc, 0x43, 0x8e, 0x34,
        0x8d, 0x81, 0xd9, 0xba, 0x3c, 0x0c, 0x09, 0xaa, 0xea, 0x92, 0x71, 0xea, 0x14, 0x0a, 0x8c, 0x5e,
    ];

    #[allow(clippy::unreadable_literal)]
    const VK_BYTES: [u8; 836] = [
        0x12, 0x19, 0x7f, 0x33, 0x2e, 0xad, 0xfc, 0x02, 0x04, 0x62, 0x95, 0x01, 0x7b, 0x24, 0xc2, 0x73,
        0xc3, 0xfd, 0x2b, 0x9c, 0x52, 0x9e, 0x99, 0xad, 0x52, 0x01, 0x85, 0x4e, 0x7a, 0xc6, 0x5c, 0x15,
        0x2b, 0xe9, 0xce, 0xc0, 0x6d, 0x31, 0x9f, 0xe5, 0xc9, 0x8f, 0x76, 0x52, 0xd9, 0x05, 0x25, 0x1f,
        0xe7, 0x81, 0x5a, 0xa7, 0xa1, 0x96, 0x8b, 0x55, 0xd1, 0x6d, 0x91, 0x59, 0x57, 0xad, 0x9a, 0xa4,
        0x24, 0xb1, 0x77, 0xaf, 0x26, 0xac, 0x4e, 0xb9, 0x42, 0xbc, 0xb8, 0x7f, 0xb7, 0xf9, 0xcd, 0xb9,
        0x84, 0x27, 0xdc, 0x14, 0xd9, 0x0d, 0x55, 0x9b, 0xab, 0x3f, 0x97, 0x4a, 0x21, 0xf9, 0xaa, 0x61,
        0x03, 0x01, 0xbd, 0xd9, 0xd3, 0xdc, 0x06, 0x09, 0xe1, 0xba, 0x17, 0x09, 0x58, 0x7b, 0xea, 0x47,
        0x15, 0x58, 0xf3, 0xe4, 0x4d, 0xbd, 0x2c, 0x08, 0x2b, 0x1a, 0x99, 0xc0, 0x26, 0xcb, 0x9f, 0x3b,
        0x24, 0x29, 0x57, 0x73, 0x88, 0x5b, 0x9c, 0x38, 0xf7, 0x17, 0xe3, 0xea, 0x4f, 0xd3, 0xed, 0x41,
        0x02, 0x59, 0xbe, 0xd4, 0xf9, 0x51, 0xe0, 0x72, 0x32, 0xf4, 0x53, 0xcb, 0x22, 0x7f, 0x07, 0x78,
        0x01, 0x8f, 0xee, 0xa5, 0x71, 0x39, 0x33, 0x68, 0xe5, 0xaa, 0x68, 0x4f, 0x10, 0x6e, 0x5a, 0x37,
        0x21, 0x0f, 0xfe, 0x79, 0x66, 0x81, 0xcf, 0x55, 0xf5, 0x16, 0xea, 0x21, 0x75, 0xd5, 0x42, 0xd6,
        0x19, 0x8e, 0x93, 0x93, 0x92, 0x0d, 0x48, 0x3a, 0x72, 0x60, 0xbf, 0xb7, 0x31, 0xfb, 0x5d, 0x25,
        0xf1, 0xaa, 0x49, 0x33, 0x35, 0xa9, 0xe7, 0x12, 0x97, 0xe4, 0x85, 0xb7, 0xae, 0xf3, 0x12, 0xc2,
        0x18, 0x00, 0xde, 0xef, 0x12, 0x1f, 0x1e, 0x76, 0x42, 0x6a, 0x00, 0x66, 0x5e, 0x5c, 0x44, 0x79,
        0x67, 0x43, 0x22, 0xd4, 0xf7, 0x5e, 0xda, 0xdd, 0x46, 0xde, 0xbd, 0x5c, 0xd9, 0x92, 0xf6, 0xed,
        0x09, 0x06, 0x89, 0xd0, 0x58, 0x5f, 0xf0, 0x75, 0xec, 0x9e, 0x99, 0xad, 0x69, 0x0c, 0x33, 0x95,
        0xbc, 0x4b, 0x31, 0x33, 0x70, 0xb3, 0x8e, 0xf3, 0x55, 0xac, 0xda, 0xdc, 0xd1, 0x22, 0x97, 0x5b,
        0x12, 0xc8, 0x5e, 0xa5, 0xdb, 0x8c, 0x6d, 0xeb, 0x4a, 0xab, 0x71, 0x80, 0x8d, 0xcb, 0x40, 0x8f,
        0xe3, 0xd1, 0xe7, 0x69, 0x0c, 0x43, 0xd3, 0x7b, 0x4c, 0xe6, 0xcc, 0x01, 0x66, 0xfa, 0x7d, 0xaa,
        0x0e, 0x02, 0x97, 0x5a, 0x4f, 0x45, 0xa0, 0xa9, 0xf6, 0xea, 0x3a, 0x95, 0xfc, 0x3e, 0xe5, 0x0b,
        0xb8, 0xc6, 0x62, 0xf2, 0x53, 0xfa, 0xd3, 0xad, 0xbe, 0xd1, 0x84, 0x20, 0x58, 0x22, 0x88, 0x3b,
        0x1d, 0x96, 0x9e, 0xb4, 0x6a, 0xdb, 0x25, 0xa0, 0x74, 0x49, 0xf8, 0xd6, 0x91, 0xa0, 0x0d, 0x8e,
        0xdc, 0x27, 0x7d, 0x7d, 0xfd, 0x56, 0x24, 0x08, 0x39, 0xfc, 0xa7, 0x33, 0x75, 0x9b, 0xf5, 0x5e,
        0x02, 0xc7, 0x7c, 0x47, 0x40, 0xad, 0xfa, 0xda, 0x2a, 0xa3, 0x67, 0xb1, 0xb6, 0x17, 0xb0, 0x6b,
        0x00, 0xdb, 0x2d, 0x21, 0x8a, 0x62, 0xf7, 0x9e, 0x11, 0xc4, 0xce, 0xa8, 0xba, 0x14, 0xca, 0x92,
        0x03, 0x40, 0x1c, 0xe8, 0x99, 0xd9, 0xfe, 0xb2, 0x82, 0x6b, 0x00, 0xb0, 0x94, 0xe1, 0x36, 0xee,
        0xe5, 0xb5, 0xe5, 0xe0, 0xfe, 0xce, 0x12, 0x2e, 0xe6, 0xd6, 0x8e, 0x0b, 0x41, 0x1e, 0x91, 0xe8,
        0x00, 0x00, 0x00, 0x06, 0x07, 0x26, 0xac, 0x90, 0xf4, 0x32, 0xc7, 0x9d, 0xd1, 0x82, 0x38, 0x17,
        0x29, 0xa2, 0x48, 0xec, 0xec, 0x4a, 0xab, 0xda, 0xba, 0x50, 0x83, 0x38, 0xde, 0x0d, 0x60, 0x8e,
        0x0b, 0x32, 0xb0, 0xa3, 0x0e, 0x70, 0x4f, 0x3a, 0x90, 0xf8, 0xfd, 0x22, 0xf2, 0x48, 0x0f, 0xc3,
        0x28, 0x4e, 0xf6, 0xae, 0x5e, 0x98, 0xca, 0xb5, 0x6b, 0xb1, 0xf9, 0x79, 0xb8, 0xf2, 0x48, 0xe0,
        0x66, 0xbc, 0x5d, 0xdf, 0x24, 0x98, 0x74, 0x1c, 0x02, 0xa9, 0xdc, 0x99, 0xe1, 0xd0, 0x2d, 0x14,
        0xad, 0x74, 0x07, 0x48, 0xe1, 0x2a, 0xd6, 0xb7, 0x3b, 0x54, 0x28, 0x10, 0xe5, 0x68, 0x02, 0x56,
        0xc7, 0x85, 0x1d, 0x5f, 0x19, 0x68, 0x05, 0x56, 0x97, 0x39, 0x8e, 0x46, 0x1b, 0x0f, 0xf3, 0xa4,
        0x0c, 0xa1, 0x31, 0x91, 0xe4, 0x55, 0xdf, 0xe3, 0xca, 0xc6, 0x56, 0x6d, 0x8d, 0x91, 0xc8, 0xe4,
        0x73, 0xf4, 0xb5, 0x30, 0x06, 0x03, 0x4f, 0x97, 0x46, 0xa7, 0x71, 0xac, 0x86, 0xff, 0xe4, 0x17,
        0x2f, 0x07, 0x23, 0x4f, 0x59, 0x7d, 0x4b, 0xb1, 0x88, 0xd7, 0x35, 0x2a, 0x9b, 0x63, 0x00, 0x9e,
        0x8b, 0x59, 0x84, 0x3a, 0x21, 0x1c, 0x5d, 0xef, 0xac, 0x52, 0xd1, 0x1d, 0x2b, 0x25, 0xb4, 0x82,
        0x96, 0x50, 0x5f, 0xc9, 0x0a, 0x6b, 0x50, 0x83, 0x9c, 0x65, 0x03, 0x1e, 0x82, 0x7e, 0xf9, 0x55,
        0xd0, 0x44, 0x36, 0xa6, 0x15, 0x42, 0x05, 0x87, 0xa4, 0x53, 0xaa, 0x11, 0x8b, 0x3a, 0xe2, 0x42,
        0xc5, 0x19, 0x3f, 0xa8, 0x36, 0x52, 0x53, 0x93, 0x5f, 0x36, 0x0d, 0x18, 0x02, 0xab, 0x8e, 0x53,
        0x8f, 0x6e, 0x62, 0xe6, 0x0c, 0x8f, 0xd1, 0x19, 0x36, 0xf7, 0xd2, 0xfb, 0x0d, 0x38, 0x5f, 0xf8,
        0x9d, 0xe2, 0x52, 0xfc, 0x3c, 0x1a, 0x74, 0xf2, 0xbc, 0x6e, 0xb3, 0x78, 0xae, 0xe3, 0x35, 0xae,
        0x16, 0xf4, 0xc8, 0x35, 0x01, 0x9d, 0x26, 0x90, 0xeb, 0x07, 0xac, 0x6c, 0x38, 0x7e, 0xff, 0x1e,
        0x98, 0xf7, 0x17, 0xe7, 0xe8, 0x99, 0x0d, 0x5d, 0xc0, 0x0d, 0x0b, 0x7a, 0x73, 0x4a, 0xdf, 0x8f,
        0xb8, 0xf6, 0xb7, 0x8f, 0x2a, 0x67, 0xbf, 0x90, 0x20, 0x9c, 0xb4, 0xa5, 0x45, 0x01, 0x6d, 0xc1,
        0xb6, 0x25, 0x9e, 0xc1, 0xd7, 0x2d, 0xaf, 0x26, 0x5f, 0x32, 0x33, 0xcc, 0x5f, 0x0e, 0x99, 0xe6,
        0xc2, 0x3a, 0x5e, 0x63, 0x0a, 0x2d, 0x23, 0xec, 0x7d, 0x8e, 0x76, 0x13, 0x34, 0x32, 0x9c, 0xad,
        0x6e, 0x0a, 0x72, 0xf7, 0xd5, 0x99, 0x12, 0xa0, 0xa4, 0xb2, 0x44, 0x0d, 0x94, 0x3e, 0x13, 0x66,
        0x61, 0xec, 0x35, 0x0c, 0x06, 0xff, 0xf5, 0xf0, 0x34, 0x2b, 0xb2, 0x0a, 0xb8, 0x46, 0xea, 0x6f,
        0x89, 0xc4, 0xa3, 0x1e, 0xf4, 0x16, 0xf8, 0xf3, 0x84, 0xf3, 0x97, 0xbd, 0x87, 0xb9, 0x05, 0xe8,
        0xc5, 0xe9, 0x0d, 0x6c,
    ];

    // Public inputs from public.json — [poolMerkleRoot, aspMerkleRoot, nullifierHash, recipient, amountPub]
    const PUB_INPUT_0: [u8; 32] = [  // poolMerkleRoot
        0x1e, 0x9a, 0x6d, 0xc3, 0x0c, 0xb4, 0x74, 0x05, 0x98, 0x15, 0xbe, 0xdc, 0xd2, 0xb9, 0xb7, 0x59,
        0x0f, 0x0b, 0xfd, 0xb8, 0xd4, 0x7b, 0x93, 0x49, 0x38, 0xd7, 0xd3, 0x19, 0xa9, 0x0f, 0x0f, 0x34,
    ];
    const PUB_INPUT_1: [u8; 32] = [  // aspMerkleRoot (identical for MVP)
        0x1e, 0x9a, 0x6d, 0xc3, 0x0c, 0xb4, 0x74, 0x05, 0x98, 0x15, 0xbe, 0xdc, 0xd2, 0xb9, 0xb7, 0x59,
        0x0f, 0x0b, 0xfd, 0xb8, 0xd4, 0x7b, 0x93, 0x49, 0x38, 0xd7, 0xd3, 0x19, 0xa9, 0x0f, 0x0f, 0x34,
    ];
    const PUB_INPUT_2: [u8; 32] = [  // nullifierHash = Poseidon(2222222222222222222)
        0x0a, 0xae, 0x73, 0x21, 0xe0, 0x27, 0xd6, 0x3d, 0xd1, 0x73, 0xae, 0x13, 0x41, 0x23, 0xf4, 0x30,
        0x9c, 0xc5, 0xf9, 0xb7, 0x6d, 0x7c, 0xba, 0x17, 0x02, 0xfd, 0x11, 0xf5, 0x51, 0x18, 0x1a, 0x0a,
    ];
    const PUB_INPUT_3: [u8; 32] = [  // recipient field element = 3333333333333333333
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2e, 0x42, 0x61, 0x01, 0x83, 0x4d, 0x55, 0x55,
    ];

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let token_id = Address::generate(&env);
        let verifier_id = Address::generate(&env);
        let asp_registry_id = Address::generate(&env);

        let contract_id = env.register(PrivacyPool, ());
        let client = PrivacyPoolClient::new(&env, &contract_id);

        client.initialize(&token_id, &verifier_id, &asp_registry_id, &admin);

        let commitments = client.get_commitments();
        assert_eq!(commitments.len(), 0);
        assert_eq!(client.get_deposit_count(), 0);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_initialize_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let token_id = Address::generate(&env);
        let verifier_id = Address::generate(&env);
        let asp_registry_id = Address::generate(&env);

        let contract_id = env.register(PrivacyPool, ());
        let client = PrivacyPoolClient::new(&env, &contract_id);

        client.initialize(&token_id, &verifier_id, &asp_registry_id, &admin);
        client.initialize(&token_id, &verifier_id, &asp_registry_id, &admin);
    }

    // -----------------------------------------------------------------------
    // Test D-1: Full end-to-end flow with real withdraw.circom ZK proof
    //
    // Setup:
    //   1. groth16-verifier initialized with real VK (local PoT15 ceremony)
    //   2. SAC token minted directly to pool address (simulates a prior deposit)
    //   3. Pool Merkle root added to history (simulates indexer update after deposit)
    //   4. withdraw() called with the real snarkjs proof + 5 public inputs
    //
    // Expected: recipient's token balance increases by DEPOSIT_AMOUNT (10_000_000)
    // -----------------------------------------------------------------------

    #[test]
    fn test_withdraw_real_proof_transfers_tokens() {
        let env = Env::default();
        env.mock_all_auths();

        let pool_admin = Address::generate(&env);
        let asp_admin = Address::generate(&env);
        let recipient = Address::generate(&env);

        // --- Token setup (SAC mock) ---
        let sac_addr = env
            .register_stellar_asset_contract_v2(pool_admin.clone())
            .address();
        let token_admin_client = token::StellarAssetClient::new(&env, &sac_addr);

        // --- Groth16 verifier setup ---
        let verifier_id = env.register(groth16_verifier::Groth16Verifier, ());
        let verifier_client = groth16_verifier::Groth16VerifierClient::new(&env, &verifier_id);
        verifier_client.initialize(&Bytes::from_array(&env, &VK_BYTES));

        // --- ASP registry setup ---
        let asp_id = env.register(asp_registry::AspRegistry, ());
        let asp_client = asp_registry::AspRegistryClient::new(&env, &asp_id);
        asp_client.initialize(&asp_admin);
        // Publish the ASP root that the proof commits to (PUB_INPUT_1 == aspMerkleRoot)
        asp_client.update_asp_root(&BytesN::<32>::from_array(&env, &PUB_INPUT_1));

        // --- Privacy pool setup ---
        let pool_id = env.register(PrivacyPool, ());
        let pool_client = PrivacyPoolClient::new(&env, &pool_id);
        pool_client.initialize(&sac_addr, &verifier_id, &asp_id, &pool_admin);

        // Simulate deposit: mint tokens directly to pool (bypasses deposit() for simplicity)
        token_admin_client.mint(&pool_id, &DEPOSIT_AMOUNT);

        // Admin updates Merkle root (simulates indexer running after a real deposit)
        let pool_root = BytesN::<32>::from_array(&env, &PUB_INPUT_0);
        pool_client.update_root(&pool_root);

        // --- Withdraw with real ZK proof ---
        pool_client.withdraw(
            &Bytes::from_array(&env, &PROOF_BYTES),
            &pool_root,                                              // merkle_root
            &BytesN::<32>::from_array(&env, &PUB_INPUT_1),         // asp_root
            &BytesN::<32>::from_array(&env, &PUB_INPUT_2),         // nullifier_hash
            &recipient,                                              // on-chain recipient address
            &BytesN::<32>::from_array(&env, &PUB_INPUT_3),         // recipient_field (BN254 encoding)
            &DEPOSIT_AMOUNT,
        );

        // Confirm recipient received the tokens
        let balance = token::Client::new(&env, &sac_addr).balance(&recipient);
        assert_eq!(balance, DEPOSIT_AMOUNT, "recipient must receive DEPOSIT_AMOUNT");
    }

    // -----------------------------------------------------------------------
    // Test D-2: Double-spend rejected — same nullifier used twice
    //
    // The nullifier_hash is marked as spent after the first successful withdraw.
    // Any subsequent withdraw with the same nullifier_hash must panic before
    // reaching the token transfer.
    // -----------------------------------------------------------------------

    #[test]
    #[should_panic(expected = "nullifier already spent")]
    fn test_double_spend_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let pool_admin = Address::generate(&env);
        let asp_admin = Address::generate(&env);
        let recipient = Address::generate(&env);

        let sac_addr = env
            .register_stellar_asset_contract_v2(pool_admin.clone())
            .address();
        let token_admin_client = token::StellarAssetClient::new(&env, &sac_addr);

        let verifier_id = env.register(groth16_verifier::Groth16Verifier, ());
        let verifier_client = groth16_verifier::Groth16VerifierClient::new(&env, &verifier_id);
        verifier_client.initialize(&Bytes::from_array(&env, &VK_BYTES));

        let asp_id = env.register(asp_registry::AspRegistry, ());
        let asp_client = asp_registry::AspRegistryClient::new(&env, &asp_id);
        asp_client.initialize(&asp_admin);
        asp_client.update_asp_root(&BytesN::<32>::from_array(&env, &PUB_INPUT_1));

        let pool_id = env.register(PrivacyPool, ());
        let pool_client = PrivacyPoolClient::new(&env, &pool_id);
        pool_client.initialize(&sac_addr, &verifier_id, &asp_id, &pool_admin);

        // Fund pool with 2x so the first withdraw succeeds;
        // the second attempt must fail at the nullifier check, not the token balance.
        token_admin_client.mint(&pool_id, &(DEPOSIT_AMOUNT * 2));

        let pool_root = BytesN::<32>::from_array(&env, &PUB_INPUT_0);
        pool_client.update_root(&pool_root);

        let proof           = Bytes::from_array(&env, &PROOF_BYTES);
        let asp_root        = BytesN::<32>::from_array(&env, &PUB_INPUT_1);
        let nullifier       = BytesN::<32>::from_array(&env, &PUB_INPUT_2);
        let recipient_field = BytesN::<32>::from_array(&env, &PUB_INPUT_3);

        // First withdraw — succeeds
        pool_client.withdraw(&proof, &pool_root, &asp_root, &nullifier, &recipient, &recipient_field, &DEPOSIT_AMOUNT);

        // Second withdraw with same nullifier — must panic "nullifier already spent"
        pool_client.withdraw(&proof, &pool_root, &asp_root, &nullifier, &recipient, &recipient_field, &DEPOSIT_AMOUNT);
    }

    // -----------------------------------------------------------------------
    // Test D-3: ASP root not published by registry — rejected before ZK
    //
    // The ASP registry has no roots published (update_asp_root never called).
    // Even with a valid ZK proof that commits to PUB_INPUT_1 as aspMerkleRoot,
    // the contract must reject with "invalid asp root" before calling the verifier.
    // This proves on-chain ASP compliance enforcement is real, not ZK-only.
    // -----------------------------------------------------------------------

    #[test]
    #[should_panic(expected = "invalid asp root")]
    fn test_asp_root_not_in_registry_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let pool_admin = Address::generate(&env);
        let asp_admin = Address::generate(&env);
        let recipient = Address::generate(&env);

        let sac_addr = env
            .register_stellar_asset_contract_v2(pool_admin.clone())
            .address();
        let token_admin_client = token::StellarAssetClient::new(&env, &sac_addr);

        let verifier_id = env.register(groth16_verifier::Groth16Verifier, ());
        let verifier_client = groth16_verifier::Groth16VerifierClient::new(&env, &verifier_id);
        verifier_client.initialize(&Bytes::from_array(&env, &VK_BYTES));

        // ASP registry initialized but no root ever published
        let asp_id = env.register(asp_registry::AspRegistry, ());
        let asp_client = asp_registry::AspRegistryClient::new(&env, &asp_id);
        asp_client.initialize(&asp_admin);
        // Deliberately NOT calling asp_client.update_asp_root(...)

        let pool_id = env.register(PrivacyPool, ());
        let pool_client = PrivacyPoolClient::new(&env, &pool_id);
        pool_client.initialize(&sac_addr, &verifier_id, &asp_id, &pool_admin);

        token_admin_client.mint(&pool_id, &DEPOSIT_AMOUNT);

        // Pool root is valid — this check must pass so the ASP check is reached
        let pool_root = BytesN::<32>::from_array(&env, &PUB_INPUT_0);
        pool_client.update_root(&pool_root);

        // Attempt to withdraw using the real proof's ASP root, which is NOT in the registry
        // Expected: panic "invalid asp root" — ZK verifier is never reached
        pool_client.withdraw(
            &Bytes::from_array(&env, &PROOF_BYTES),
            &pool_root,
            &BytesN::<32>::from_array(&env, &PUB_INPUT_1), // asp_root not in registry
            &BytesN::<32>::from_array(&env, &PUB_INPUT_2),
            &recipient,
            &BytesN::<32>::from_array(&env, &PUB_INPUT_3),
            &DEPOSIT_AMOUNT,
        );
    }
}