#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Vec};

const MAX_ROOTS_HISTORY: u32 = 100;

#[contracttype]
pub enum DataKey {
    Admin,
    ApprovedCommitments,
    DeniedCommitments,
    AspRoot,
    AspRootsHistory,
}

#[contract]
pub struct AspRegistry;

#[contractimpl]
impl AspRegistry {
    /// Initialize with a single admin (Mongli DAO multisig in production).
    /// MVP: centralized admin. Document this clearly.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);

        let empty: Vec<BytesN<32>> = Vec::new(&env);
        env.storage().instance().set(&DataKey::ApprovedCommitments, &empty);
        env.storage().instance().set(&DataKey::DeniedCommitments, &empty);
        env.storage().instance().set(&DataKey::AspRootsHistory, &empty);
    }

    /// Admin approves a commitment to the ASP allowlist.
    pub fn approve_commitment(env: Env, commitment: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut approved: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::ApprovedCommitments)
            .unwrap_or(Vec::new(&env));

        // Idempotent: skip if already approved
        for i in 0..approved.len() {
            if approved.get(i).unwrap() == commitment {
                return;
            }
        }

        approved.push_back(commitment.clone());
        env.storage().instance().set(&DataKey::ApprovedCommitments, &approved);

        env.events().publish(
            (symbol_short!("approve"),),
            commitment,
        );
    }

    /// Admin denies (blacklists) a commitment.
    pub fn deny_commitment(env: Env, commitment: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut denied: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::DeniedCommitments)
            .unwrap_or(Vec::new(&env));

        denied.push_back(commitment.clone());
        env.storage().instance().set(&DataKey::DeniedCommitments, &denied);

        env.events().publish(
            (symbol_short!("deny"),),
            commitment,
        );
    }

    /// Admin updates the ASP Merkle root after approving commitments.
    /// The root represents the Merkle tree of all approved commitments.
    pub fn update_asp_root(env: Env, new_root: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut history: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::AspRootsHistory)
            .unwrap_or(Vec::new(&env));

        history.push_back(new_root.clone());

        if history.len() > MAX_ROOTS_HISTORY {
            history.pop_front_unchecked();
        }

        env.storage().instance().set(&DataKey::AspRootsHistory, &history);
        env.storage().instance().set(&DataKey::AspRoot, &new_root);

        env.events().publish(
            (symbol_short!("asp_root"),),
            new_root,
        );
    }

    // --- View functions ---

    pub fn get_asp_root(env: Env) -> Option<BytesN<32>> {
        env.storage().instance().get(&DataKey::AspRoot)
    }

    pub fn get_asp_roots_history(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::AspRootsHistory)
            .unwrap_or(Vec::new(&env))
    }

    pub fn is_approved(env: Env, commitment: BytesN<32>) -> bool {
        // Commitment must be in approved list AND not in denied list
        let approved: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::ApprovedCommitments)
            .unwrap_or(Vec::new(&env));

        let denied: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::DeniedCommitments)
            .unwrap_or(Vec::new(&env));

        let mut in_approved = false;
        for i in 0..approved.len() {
            if approved.get(i).unwrap() == commitment {
                in_approved = true;
                break;
            }
        }

        if !in_approved {
            return false;
        }

        for i in 0..denied.len() {
            if denied.get(i).unwrap() == commitment {
                return false;
            }
        }

        true
    }

    pub fn get_approved_commitments(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::ApprovedCommitments)
            .unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

    #[test]
    fn test_initialize_and_approve() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(AspRegistry, ());
        let client = AspRegistryClient::new(&env, &contract_id);

        client.initialize(&admin);

        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        assert!(!client.is_approved(&commitment));

        client.approve_commitment(&commitment);
        assert!(client.is_approved(&commitment));
    }

    #[test]
    fn test_approve_then_deny() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(AspRegistry, ());
        let client = AspRegistryClient::new(&env, &contract_id);

        client.initialize(&admin);

        let commitment = BytesN::from_array(&env, &[2u8; 32]);
        client.approve_commitment(&commitment);
        assert!(client.is_approved(&commitment));

        client.deny_commitment(&commitment);
        assert!(!client.is_approved(&commitment));
    }

    #[test]
    fn test_update_asp_root() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(AspRegistry, ());
        let client = AspRegistryClient::new(&env, &contract_id);

        client.initialize(&admin);

        assert!(client.get_asp_root().is_none());

        let root = BytesN::from_array(&env, &[42u8; 32]);
        client.update_asp_root(&root);

        assert_eq!(client.get_asp_root().unwrap(), root);
        assert_eq!(client.get_asp_roots_history().len(), 1);
    }

    #[test]
    fn test_approve_idempotent() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(AspRegistry, ());
        let client = AspRegistryClient::new(&env, &contract_id);

        client.initialize(&admin);

        let commitment = BytesN::from_array(&env, &[3u8; 32]);
        client.approve_commitment(&commitment);
        client.approve_commitment(&commitment);

        // Should still only appear once
        assert_eq!(client.get_approved_commitments().len(), 1);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_double_initialize_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(AspRegistry, ());
        let client = AspRegistryClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.initialize(&admin);
    }
}