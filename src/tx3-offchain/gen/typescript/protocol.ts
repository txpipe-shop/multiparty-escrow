// This file is auto-generated.

import {
  Client as TRPClient,
  type ClientOptions,
  type TxEnvelope,
} from "tx3-sdk/trp";

export const DEFAULT_TRP_ENDPOINT = "http://localhost:3000/trp";

export const DEFAULT_HEADERS = {};

export const DEFAULT_ENV_ARGS = {};

export type OpenParams = {
  channelid: Uint8Array;
  date: number;
  groupid: Uint8Array;
  initialdeposit: number;
  inputref: string;
  policyid: Uint8Array;
  receiverinput: Uint8Array;
  sender: string;
  signerpubkey: Uint8Array;
  since: number;
  tokenname: Uint8Array;
  until: number;
};

export const OPEN_IR = {
  bytecode:
    "12010a012082af870a1773a793127f34d55634fa6ad774988b301e4f8e1df04ca2724b98d8000106736f7572636501010d0673656e6465720500010d08696e707574726566060000000201091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f8133010300060d096368616e6e656c69640405000d0c7369676e65727075626b6579040d0d7265636569766572696e707574040d0767726f75706964040d0464617465020111110c01041c921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce13200404414749580d0e696e697469616c6465706f736974020c01000005fc80969800000c010d08706f6c6963796964040d09746f6b656e6e616d6504050200010d0673656e6465720500011111111006736f757263650c01041c921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce13200404414749580d0e696e697469616c6465706f736974020112010c01000005fc809698000101010d0573696e636502010d05756e74696c0201010c010d08706f6c6963796964040d09746f6b656e6e616d650405020103000000010000010a012036f545ec1fd3c4c5141b342c5a7e0d5a7592a13e49d0ae61082e91d90303d524050000",
  encoding: "hex",
  version: "v1alpha3",
};

export type CloseParams = {
  channelutxo: string;
  policyid: Uint8Array;
  scriptScript: string;
  sender: string;
  since: number;
  tokenname: Uint8Array;
  until: number;
};

export const CLOSE_IR = {
  bytecode:
    "12010a012082af870a1773a793127f34d55634fa6ad774988b301e4f8e1df04ca2724b98d80001067461726765740101091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f813300010d0b6368616e6e656c7574786f0600010302000106536372697074091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f81330001010d0673656e6465720500011111100674617267657412010c010d08706f6c6963796964040d09746f6b656e6e616d650405020101010d0573696e636502010d05756e74696c0201010c010d08706f6c6963796964040d09746f6b656e6e616d650405010103000000010000010a012036f545ec1fd3c4c5141b342c5a7e0d5a7592a13e49d0ae61082e91d90303d5240501010d0673656e6465720500",
  encoding: "hex",
  version: "v1alpha3",
};

export class Client {
  readonly #client: TRPClient;

  constructor(options: ClientOptions) {
    this.#client = new TRPClient(options);
  }

  async openTx(args: OpenParams): Promise<TxEnvelope> {
    return await this.#client.resolve({
      tir: OPEN_IR,
      args,
    });
  }
  async closeTx(args: CloseParams): Promise<TxEnvelope> {
    return await this.#client.resolve({
      tir: CLOSE_IR,
      args,
    });
  }
}

// Create a default client instance
export const protocol = new Client({
  endpoint: DEFAULT_TRP_ENDPOINT,
  headers: DEFAULT_HEADERS,
  envArgs: DEFAULT_ENV_ARGS,
});
