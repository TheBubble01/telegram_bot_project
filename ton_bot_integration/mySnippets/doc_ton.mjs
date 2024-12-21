import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";

const client = new TonClient({
  //endpoint: 'https://ton.access.orbs.network/4410c0ff5Bd3F8B62C092Ab4D238bEE463E64410/1/mainnet/ton-api-v4',
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: '5ba494fc5174eb060fa02740785437c9eac28efd11301eed0136fd8dc997783d', // Optional, but note that without api-key you need to send requests once per second, and with 0.25 seconds
});

// Convert mnemonics to private key
let mnemonics = "spend climb brother enjoy convince speed prosper sight ghost rapid purpose client decide retreat settle stock carpet lunar find exist exact must explain actor".split(" ");
let keyPair = await mnemonicToPrivateKey(mnemonics);
console.log("Private Key: ", keyPair.secretKey.toString('hex'));

// Create wallet contract
let workchain = 0; // Usually you need a workchain 0
let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
let contract = client.open(wallet);

//account state
let balance = await contract.getBalance();
console.log("Balance: ", balance.toString());


// Create a transfer
let seqno = await contract.getSeqno();
console.log("seqno: ", seqno);
await contract.sendTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [internal({
    value: '0.55',
    to: 'EQBbwxC0WnOlXVwC5a8SEwd-_jtg3d3YCt0th_VA4IC9NkDS',
    //to: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
    body: 'Example transfer body',
  })]
});
