# MultiParty Escrow
The MultiParty Escrow (MPE) smart contract manages payment channels between **clients** —who act as senders, consumers, or service customers— and **service providers**, who serve as receivers or recipients.

## Documentation
- [Requirements](./docs/requeriments.md)
- [Design](./docs/design.md)

## Environment files

We need to have a `.env` file at the src with the following content:

```js
PORT = 3000
PROVIDER_PROJECT_ID = ""
PROVIDER_URL = ""
NETWORK = ""
CONFIG_FILE = ""
```

Where CONFIG_FILE is the name of a file inside the project, with the following format:

```js
{
   // "token": "[policyId][hexaName]"
   "token": "fa3eff2047fdf9293c5feef4dc85ce58097ea1c6da4845a35153518374494e4459",
   "ref_script": {
      "txHash": "7e92e7c52605d5beb83ccae335a49bcc894d56bf240f7aaee651491c8eb174b8"
   }
}
```

Some scripts that run on test networks rely on a 24-word mnemonic which must be set on a `.test-env` file at src:
```js
SEED ="soda water ..."
```
Note: For safety, always use a mnemonic intended only for testing. Never use real or production mnemonics.

## Run Instructions

### Server
For the first time, run `npm install` inside the `src` folder to install all the dependencies.

To run the server, run `npm run dev` inside the `src` folder.

### Compile validator
**Note**: Aiken must be installed. Check the `aiken.toml` file to match the correct compiler version.

Inside `onchain`, run `aiken build`.

### Generate types
Run `bash parse-blueprint.sh` to generate the contract types from the validator's blueprint.

### Test with emulator
To test the offchain operations, you can run the following commands from the `src` folder.

**Open a channel**
A channel with 6 tokens will be created.
```shell
   $> npm run test-open
```
**Update a channel**
A channel will be created and then updated, funding 3 tokens more and extending its expiration date.
```shell
   $> npm run test-update
```

**Build a message**
A channel will be created with an initial amount of 6 tokens, and a message will be created and signed, indicating that the receiver can claim 3 tokens from the channel.
```shell
   $> npm run test-build-msg
```

**Claim a channel**
A channel will be created with an initial deposit of 600 tokens. Then, a message authorizing the claim of 20 tokens will be signed, which will be used to make a claim. Another message will be signed authorizing the transfer of 60 tokens, followed by a final claim that will also close the channel.

```shell
   $> npm run test-claim
```

**Multi Claim of channels**
Two channels will be created by the same sender, which we'll refer to as A and B, with initial deposits of 100 and 20 tokens, respectively.

Two messages will be created to claim 20 tokens from channel A and 10 tokens from channel B. Both claims will be executed, and channel B will be closed.

Finally, another message will be created to claim 60 tokens from channel A, which will also result in its closure.

```shell
   $> npm run test-claim
```

**Close a channel**
```shell
   $> npm run test-close
```

**Test combined operations**
First, a channel is created with an initial deposit of 6 tokens. Then, an update adds 3 more tokens to the channel. A message for 7 tokens is signed and later used to claim the channel. Finally, the channel is closed, returning the remaining tokens to the sender.
```shell
   $> npm run test-all
```

### Test with testnet
To emulate this operations on testnet, complete the  `.test-env` file at the src with:
```js
SEED="decrease cash kangaroo ..."
```
Then run:
```shell
   $> npm run cli-preview
```
And input as appropiate.

### Test with jest
To test the operations with jest, try:
```shell
   $> npm run test
```