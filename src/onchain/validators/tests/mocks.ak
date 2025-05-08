use aiken/primitive/bytearray.{concat}
use cardano/address.{Address, Script, VerificationKey}
use cardano/transaction.{OutputReference}
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

pub const channel_id_1 = concat(tx_hash_1, "0")

pub const seed_utxo_2 =
  OutputReference { transaction_id: tx_hash_2, output_index: 0 }

pub const channel_id_2 = concat(tx_hash_2, "0")

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
  #"145562a792f2ca28ae87f1f7afd25b126f76547103204f62432999bcc2b5c542"

// Group id
pub const group_id = mock_key_hash(42)

// Signature for amount 20, nonce 0
pub const signature_1 =
  #"2b40f5776b30df3ee894b95232d47cdf7d66a9b521bdbdafab20c9f0c4b9b78717ded59d250ae59b3d8904462e4ded30c97b84eb3c5793b72cca83499bc00204"

pub const signature_2 =
  #"b2ab64bec64b766212290a48474fd2a17cf576e6a9fc9141e16418e699f21e36b5afe33467b4a38dbae56fda18c78f6b14864e4f6337365b847f692a3de0cc02"
