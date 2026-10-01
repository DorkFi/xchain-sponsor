# xChain sponsored accounts

Sponsor gas for an EVM wallet and the Algorand account derived from it.

An embedded or external EVM wallet (Privy, MetaMask, and others) signs Algorand transactions through [xChain](https://github.com/algorandfoundation/xchain-accounts) (`algo-x-evm-sdk`, MIT). This package derives that Algorand address, signs with the EVM wallet's EIP-712 typed data, and runs a server that drips Base ETH and ALGO when the account is below a floor.

The xChain protocol itself stays upstream. This repo is the sponsorship layer.

## What it does

1. Derive the Algorand LogicSig address from an EVM address.
2. Sign unsigned Algorand transaction blobs with `signTypedData`.
3. `POST /api/easy-start/sponsor` checks a Privy session, confirms the destination wallet belongs to that user, and sends **0.0001 ETH** on Base and **1 ALGO** when balances are under **0.00005 ETH** and **0.1 spendable ALGO**.

The server holds a hot Base key and an Algorand mnemonic. The JWT check, the wallet-ownership check, a per-user limit of 5 requests per minute, and an in-flight lock per address are what stop a caller from sending the treasury to an arbitrary address. Use a dedicated treasury. Do not reuse a personal key.

## Install

```bash
npm install @dorkfi/xchain-sponsor
```

Until this is published, depend on the git checkout:

```json
{
  "dependencies": {
    "@dorkfi/xchain-sponsor": "file:../xchain-sponsor"
  }
}
```

## Browser

```ts
import {
  deriveAlgorandXchainAddress,
  signXchainTransactions,
  requestSponsor,
} from "@dorkfi/xchain-sponsor";

const algorandAddress = await deriveAlgorandXchainAddress(evmAddress);

const signed = await signXchainTransactions(
  evmAddress,
  unsignedTxnBlobs,
  signTypedData
);

const sponsor = await requestSponsor({ accessToken, evmAddress });
```

`requestSponsor` posts to `VITE_XCHAIN_SPONSOR_API_BASE`, then `VITE_EASY_START_API_BASE`, then `/api/easy-start`. A response of HTTP 200 with a failed leg throws, so the caller retries.

## Server

```ts
import { createServer } from "node:http";
import {
  loadSponsorEnv,
  routeSponsorRequest,
} from "@dorkfi/xchain-sponsor/server";

const env = loadSponsorEnv(process.env);

createServer((req, res) => {
  const url = req.url || "/";
  void routeSponsorRequest(req, res, env, url).then((handled) => {
    if (!handled) {
      res.statusCode = 404;
      res.end();
    }
  });
}).listen(8789);
```

| Route | Method | Behavior |
| --- | --- | --- |
| `/api/easy-start/health` | GET | `{ ok, enabled, configured, live }` |
| `/api/easy-start/sponsor` | POST | `{ evmAddress }` plus `Authorization: Bearer <Privy access token>` |

| Variable | Required | Description |
| --- | --- | --- |
| `SPONSOR_ENABLED` | Yes | `true` to send. Off returns `skipped` / `disabled`. |
| `PRIVY_APP_ID` | Yes | Privy app id. Falls back to `VITE_PRIVY_APP_ID`. No baked-in id. |
| `PRIVY_APP_SECRET` | Yes | Binds the destination to a wallet on the Privy user. |
| `SPONSOR_ETH_PRIVATE_KEY` | Yes | Dedicated Base treasury key. |
| `SPONSOR_ALGO_MNEMONIC` | Yes | Dedicated Algorand 25-word mnemonic. |
| `SPONSOR_ETH_AMOUNT_WEI` | No | Default `100000000000000` (0.0001 ETH). |
| `SPONSOR_ALGO_MICRO` | No | Default `1000000` (1 ALGO). |
| `SPONSOR_ETH_RPC` | No | Default `https://mainnet.base.org`. |
| `SPONSOR_ALGOD_URL` | No | Default Nodely mainnet algod. |

Copy `.env.example`. Never prefix server secrets with `VITE_`.

## Develop

```bash
npm install
npm test
```

Node 22 or newer.

## License

MIT. `algo-x-evm-sdk`, `algosdk`, and `viem` are MIT as well.
