use aiken/cbor.{serialise}
use aiken/primitive/bytearray.{concat}
use cardano/address.{Address, Script}
use cardano/assets.{Value, ada_asset_name, ada_policy_id, add, from_asset, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Redeemer, Spend,
  Transaction, placeholder,
}
use cocktail.{address_pub_key}
use config
use mocktail.{
  add_input, add_mint, add_output, add_redeemer, add_withdrawal, mock_interval,
  mock_policy_id, mock_pub_key_address, set_transaction_id,
}
use mocktail/virgin_output_reference.{mock_tx_hash}
use singularity
use types.{Action, Close, Datum}

const script_hash = mock_policy_id(0)

const sender_addr = mock_pub_key_address(0, None)

const burned_asset = {
    expect Some(pub_key_hash) = address_pub_key(sender_addr)
    from_asset(script_hash, pub_key_hash, -1)
  }

const channel_token = {
    expect Some(pub_key_hash) = address_pub_key(sender_addr)
    from_asset(script_hash, pub_key_hash, 1)
  }

const default_value =
  channel_token
    |> add(ada_policy_id, ada_asset_name, 4_000_000)
    |> add(config.agix_policy, config.agix_hexa, 1_000_000)

const receiver_addr = mock_pub_key_address(1, None)

const transaction_id_1 = mock_tx_hash(0)

const transaction_id_2 = mock_tx_hash(1)

const transaction_id_3 = mock_tx_hash(2)

// ==============================================================================================
// Close Tests
// ==============================================================================================
type CloseOptions {
  minting_value: Value,
  withdrawing: Bool,
  has_script_input: Bool,
}

fn get_default_close_options() -> CloseOptions {
  CloseOptions {
    minting_value: burned_asset,
    withdrawing: False,
    has_script_input: True,
  }
}

fn close(options: CloseOptions) {
  expect Some(pub_key_hash) = address_pub_key(receiver_addr)
  let input_datum =
    Datum {
      channel_id: concat(transaction_id_1, serialise(0)),
      nonce: 0,
      signer: #"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      receiver: pub_key_hash,
      group_id: "group1",
      expiration_date: 100,
    }

  let input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: transaction_id_1,
        output_index: 0,
      },
      output: Output {
        address: Address {
          payment_credential: Script(script_hash),
          stake_credential: None,
        },
        value: from_asset(ada_policy_id, ada_asset_name, 20_000_000),
        datum: InlineDatum(input_datum),
        reference_script: None,
      },
    }

  let output_utxo =
    Output {
      address: sender_addr,
      value: default_value,
      datum: NoDatum,
      reference_script: None,
    }

  let close: Action = Close
  let close_redeemer: Redeemer = close

  let tx =
    placeholder
      |> add_input(options.has_script_input, input_utxo)
      |> add_input(
          True,
          Input {
            output_reference: OutputReference {
              transaction_id: transaction_id_3,
              output_index: 2,
            },
            output: Output {
              address: sender_addr,
              value: default_value,
              datum: NoDatum,
              reference_script: None,
            },
          },
        )
      |> add_output(True, output_utxo)
      |> add_mint(True, options.minting_value)
      |> add_redeemer(
          True,
          Pair(
            Spend(
              OutputReference {
                transaction_id: transaction_id_1,
                output_index: 0,
              },
            ),
            close_redeemer,
          ),
        )
      |> add_withdrawal(options.withdrawing, Pair(Script(script_hash), 0))
      |> set_transaction_id(True, transaction_id_2)

  let result =
    singularity.channel.mint(
      None,
      script_hash,
      self: Transaction {
        ..tx,
        validity_range: mock_interval(Some(0), Some(10)),
      },
    )
  result
}

test close_ok() {
  close(get_default_close_options())
}

test close_ok_with_withdrawal() {
  close(CloseOptions { ..get_default_close_options(), withdrawing: True })
}

test minting_somehting_else() fail {
  close(
    CloseOptions {
      ..get_default_close_options(),
      minting_value: {
        expect Some(pub_key_hash) = address_pub_key(sender_addr)
        from_asset(script_hash, pub_key_hash, 2)
      },
    },
  )
}

test no_token_burnt() fail {
  close(CloseOptions { ..get_default_close_options(), minting_value: zero })
}

test no_script_input() fail {
  close(CloseOptions { ..get_default_close_options(), has_script_input: False })
}

test no_withdrawal_no_burning() fail {
  close(
    CloseOptions {
      has_script_input: True,
      withdrawing: False,
      minting_value: zero,
    },
  )
}
