use cardano/assets.{add, zero} as value
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, Spend, Transaction, placeholder,
}
use config
use mocktail.{
  add_extra_signatory, add_input, add_mint, add_output, add_redeemer,
  mock_interval,
}
use singularity
use tests/mocks
use types.{Action, Close, Datum}

type CloseOptions {
  edit_extra_input: Bool,
  edit_signatories: Bool,
  edit_minting: Bool,
  edit_validity_range: Bool,
}

fn default_close_options() -> CloseOptions {
  CloseOptions {
    edit_extra_input: False,
    edit_signatories: False,
    edit_minting: False,
    edit_validity_range: False,
  }
}

fn close(options: CloseOptions) {
  let channel_datum =
    Datum {
      channel_id: mocks.channel_id_1,
      nonce: 0,
      signer: mocks.signer_1,
      receiver: mocks.receiver_1,
      group_id: mocks.group_id,
      expiration_date: 10,
    }

  let channel_value_base =
    zero
      |> add(mocks.own_hash, mocks.sender_1, 1)
      |> add(config.agix_policy, config.agix_hexa, 1000)

  let channel_input =
    Input {
      output: Output {
        address: mocks.own_address,
        value: channel_value_base,
        datum: InlineDatum(channel_datum),
        reference_script: None,
      },
      output_reference: mocks.channel_1_out_ref,
    }

  let extra_input =
    Input {
      output: Output {
        address: mocks.own_address,
        value: zero |> add(config.agix_policy, config.agix_hexa, 500),
        datum: NoDatum,
        reference_script: None,
      },
      output_reference: mocks.channel_2_out_ref,
    }

  let sender_output =
    Output {
      address: mocks.sender_1_address,
      value: channel_value_base
        |> add(config.agix_policy, config.agix_hexa, -1000)
        |> add(mocks.own_hash, mocks.sender_1, -1),
      datum: NoDatum,
      reference_script: None,
    }

  let mint =
    if options.edit_minting {
      zero
    } else {
      zero |> add(mocks.own_hash, mocks.sender_1, -1)
    }

  let action: Action = Close
  let redeemer: Data = action

  let tx =
    placeholder
      |> add_input(True, channel_input)
      |> add_input(options.edit_extra_input, extra_input)
      |> add_output(True, sender_output)
      |> add_mint(True, mint)
      |> add_redeemer(True, Pair(Spend(mocks.channel_1_out_ref), redeemer))
      |> add_extra_signatory(!options.edit_signatories, mocks.sender_1)
      |> fn(tx) {
          Transaction {
            ..tx,
            validity_range: if options.edit_validity_range {
              mock_interval(Some(9), Some(11))
            } else {
              mock_interval(Some(11), Some(12))
            },
          }
        }

  and {
    singularity.channel.spend(
      Some(channel_datum),
      action,
      mocks.channel_1_out_ref,
      tx,
    ),
    singularity.channel.mint(None, mocks.own_hash, tx),
  }
}

test close_ok() {
  let options = default_close_options()
  close(options)
}

test close_with_extra_input() fail {
  let options =
    CloseOptions { ..default_close_options(), edit_extra_input: True }
  close(options)
}

test close_not_signed_by_receiver() fail {
  let options =
    CloseOptions { ..default_close_options(), edit_signatories: True }
  close(options)
}

test close_wrong_minting() fail {
  let options = CloseOptions { ..default_close_options(), edit_minting: True }
  close(options)
}

test close_wrong_validity_range() fail {
  let options =
    CloseOptions { ..default_close_options(), edit_validity_range: True }
  close(options)
}
