use aiken/crypto.{VerificationKey}

pub type Datum {
  channel_id: ByteArray,
  nonce: Int,
  signer: ByteArray,
  receiver: VerificationKey,
  group_id: ByteArray,
  expiration_date: Int,
}

pub type Action {
  Update
  Claim { amount: Int, signature: ByteArray, finalize: Bool }
  Close
}
