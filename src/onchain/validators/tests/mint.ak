use aiken/cbor.{serialise}
use aiken/primitive/bytearray.{concat}
use cardano/address.{Address, Script}
use cardano/assets.{Value, ada_asset_name, ada_policy_id, add, from_asset, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, placeholder,
}
use cocktail.{address_pub_key}
use config
use mocktail.{
  add_input, add_mint, add_output, mock_interval, mock_script_credential,
  set_transaction_id,
}
use singularity
use tests/mocks
use types.{Datum}

const init_asset = {
    expect Some(pub_key_hash) = address_pub_key(mocks.sender_1_address)
    from_asset(mocks.own_hash, pub_key_hash, 1)
  }

// ==============================================================================================
// Open Tests
// ==============================================================================================
type OpenOptions {
  minted_value: Value,
  add_first_input: Bool,
  edit_output_value: Bool,
  edit_nonce: Bool,
  edit_script_addr: Bool,
}

fn get_default_open_options() -> OpenOptions {
  OpenOptions {
    minted_value: init_asset,
    add_first_input: False,
    edit_output_value: False,
    edit_nonce: False,
    edit_script_addr: False,
  }
}

fn open(options: OpenOptions) {
  expect Some(pub_key_hash) = address_pub_key(mocks.receiver_1_address)
  let init_datum =
    Datum {
      channel_id: concat(mocks.tx_hash_1, serialise(0)),
      nonce: 0,
      signer: #"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      receiver: pub_key_hash,
      group_id: "group1",
      expiration_date: 100,
    }

  let init_utxo =
    Output {
      address: mocks.sender_1_address,
      value: from_asset(ada_policy_id, ada_asset_name, 20_000_000),
      datum: NoDatum,
      reference_script: None,
    }

  let init_input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: mocks.tx_hash_1,
        output_index: 0,
      },
      output: init_utxo,
    }

  let init_output_utxo =
    Output {
      address: Address {
        payment_credential: when options.edit_script_addr is {
          True -> mock_script_credential(0)
          False -> Script(mocks.own_hash)
        },
        stake_credential: None,
      },
      value: {
        let out_value =
          init_asset
            |> add(ada_policy_id, ada_asset_name, 4_000_000)
            |> add(config.agix_policy, config.agix_hexa, 1_000_000)
        when options.edit_output_value is {
          True ->
            out_value
              |> add(#"0000", "extra_token", 1)
          False -> out_value
        }
      },
      datum: when options.edit_nonce is {
        True -> InlineDatum(Datum { ..init_datum, nonce: 10 })
        False -> InlineDatum(init_datum)
      },
      reference_script: None,
    }

  let tx =
    placeholder
      |> add_input(
          options.add_first_input,
          Input {
            output_reference: OutputReference {
              transaction_id: mocks.tx_hash_3,
              output_index: 2,
            },
            output: init_utxo,
          },
        )
      |> add_input(True, init_input_utxo)
      |> add_output(True, init_output_utxo)
      |> add_mint(True, options.minted_value)
      |> set_transaction_id(True, mocks.tx_hash_2)

  let result =
    singularity.channel.mint(
      None,
      mocks.own_hash,
      self: Transaction {
        ..tx,
        validity_range: mock_interval(Some(0), Some(10)),
      },
    )
  result
}

test open_ok() {
  open(get_default_open_options())
}

test more_than_one_token_minted() fail {
  open(
    OpenOptions {
      ..get_default_open_options(),
      minted_value: {
        expect Some(pub_key_hash) = address_pub_key(mocks.sender_1_address)
        from_asset(mocks.own_hash, pub_key_hash, 2)
      },
    },
  )
}

test no_token_minted() fail {
  open(OpenOptions { ..get_default_open_options(), minted_value: zero })
}

test channel_id_is_not_first_input_utxo_ref() fail {
  open(OpenOptions { ..get_default_open_options(), add_first_input: True })
}

test nonce_is_incorrect() fail {
  open(OpenOptions { ..get_default_open_options(), edit_nonce: True })
}

test change_output_address() fail {
  open(OpenOptions { ..get_default_open_options(), edit_script_addr: True })
}

test change_output_value() fail {
  open(OpenOptions { ..get_default_open_options(), edit_output_value: True })
}
