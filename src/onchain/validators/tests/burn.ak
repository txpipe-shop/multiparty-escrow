use cardano/address.{Script}
use cardano/assets.{Value, ada_asset_name, ada_policy_id, from_asset, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Redeemer, Spend,
  Transaction, placeholder,
}
use cocktail.{address_pub_key}
use mocktail.{
  add_input, add_mint, add_output, add_redeemer, add_withdrawal, mock_interval,
  set_transaction_id,
}
use singularity
use tests/mocks.{
  channel_id_1, default_value, group_id, own_address, own_hash, receiver_1,
  sender_1_address, signer_1, tx_hash_1, tx_hash_2, tx_hash_3,
}
use types.{Action, Close, Datum}

const burned_asset = {
    expect Some(pub_key_hash) = address_pub_key(sender_1_address)
    from_asset(own_hash, pub_key_hash, -1)
  }

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
  let input_datum =
    Datum {
      channel_id: channel_id_1,
      nonce: 0,
      signer: signer_1,
      receiver: receiver_1,
      group_id,
      expiration_date: 100,
    }

  let input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: tx_hash_1,
        output_index: 0,
      },
      output: Output {
        address: own_address,
        value: from_asset(ada_policy_id, ada_asset_name, 20_000_000),
        datum: InlineDatum(input_datum),
        reference_script: None,
      },
    }

  let output_utxo =
    Output {
      address: sender_1_address,
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
              transaction_id: tx_hash_3,
              output_index: 2,
            },
            output: Output {
              address: sender_1_address,
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
              OutputReference { transaction_id: tx_hash_1, output_index: 0 },
            ),
            close_redeemer,
          ),
        )
      |> add_withdrawal(options.withdrawing, Pair(Script(own_hash), 0))
      |> set_transaction_id(True, tx_hash_2)

  let result =
    singularity.channel.mint(
      None,
      own_hash,
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
        expect Some(pub_key_hash) = address_pub_key(sender_1_address)
        from_asset(own_hash, pub_key_hash, 2)
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
