use aiken/cbor.{serialise}
use aiken/primitive/bytearray.{concat}
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{ada_asset_name, ada_policy_id, add, from_asset}
use cardano/transaction.{OutputReference}
use cocktail.{address_pub_key}
use config
use mocktail.{mock_key_hash, mock_tx_hash}

// Script hash and minting policy
pub const own_hash = mock_key_hash(0)

pub const own_address =
  Address { payment_credential: Script(own_hash), stake_credential: None }

// Out refs and channel Ids
pub const tx_hash_1 = mock_tx_hash(0)

pub const tx_hash_2 = mock_tx_hash(1)

pub const tx_hash_3 = mock_tx_hash(2)

pub const seed_utxo_1 =
  OutputReference { transaction_id: tx_hash_1, output_index: 0 }

pub const channel_id_1 = concat(tx_hash_1, serialise(0))

pub const seed_utxo_2 =
  OutputReference { transaction_id: tx_hash_2, output_index: 0 }

pub const channel_id_2 = concat(tx_hash_2, serialise(0))

pub const channel_1_out_ref =
  OutputReference { transaction_id: mock_tx_hash(100), output_index: 0 }

pub const channel_2_out_ref =
  OutputReference { transaction_id: mock_tx_hash(101), output_index: 0 }

// Signers, receivers and senders
pub const sender_1 = mock_key_hash(0)

pub const sender_1_address =
  Address {
    payment_credential: VerificationKey(sender_1),
    stake_credential: None,
  }

pub const sender_2 = mock_key_hash(1)

pub const sender_2_address =
  Address {
    payment_credential: VerificationKey(sender_2),
    stake_credential: None,
  }

pub const receiver_1 = mock_key_hash(3)
pub const receiver_1_address =
  Address {
    payment_credential: VerificationKey(receiver_1),
    stake_credential: None,
  }

pub const signer_1 =
  #"0a0b0bddc14de4b88bd3e9cc7d29886ce1bb637b81dbcc3a87d6992822dd1eab"

// Channel token
pub const channel_token = {
    expect Some(pub_key_hash) = address_pub_key(sender_1_address)
    from_asset(own_hash, pub_key_hash, 1)
  }

// Burned asset
pub const burned_asset = {
    expect Some(pub_key_hash) = address_pub_key(sender_1_address)
    from_asset(own_hash, pub_key_hash, -1)
  }

// Default value
pub const default_value =
  channel_token
    |> add(ada_policy_id, ada_asset_name, 4_000_000)
    |> add(config.agix_policy, config.agix_hexa, 1_000_000)

// Group id
pub const group_id = mock_key_hash(42)

// Signature for amount 20, nonce 0
pub const signature_1 =
  #"6b3b30460287fddc53c26b5d611c3550f21cebdd1326dbb4f159ed9d243d7702b599bb383151703f3bf3754827a4756bf56e6ac6fa76763ca5d8315bb71add09"

pub const signature_2 =
  #"371a54ae59cfd67bb1cc423ee30c2421415f7a1ea6a1c5bffe8d380dce44b6824b8802bebb0f077d21cfbc42a9ea2ea4f212479bcbd8bb118f37164e073c8205"
