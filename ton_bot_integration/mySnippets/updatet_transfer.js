import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import NodeCache from "node-cache";

// Initialize Cache (TTL = 30 seconds)
const cache = new NodeCache({ stdTTL: 30 });

// Initialize TON Client
function initTonClient(apiKey, endpoint) {
    return new TonClient({
        endpoint,
        apiKey, // Provide the API key for faster requests
    });
}

// Retrieve Wallet State with Caching
async function getWalletStateCached(client, mnemonics) {
    const cacheKey = "walletState";

    // Check if wallet state is cached
    const cachedState = cache.get(cacheKey);
    if (cachedState) {
        console.log("Returning cached wallet state...");
        return cachedState;
    }

    try {
        // Generate wallet and fetch state
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        const seqno = await contract.getSeqno();
        const balance = await contract.getBalance();

        console.log("Seqno:", seqno);
        console.log("Balance:", balance.toString(), "nanoTON");

        const walletState = { seqno, balance: balance.toString() };
        cache.set(cacheKey, walletState); // Cache the state
        return walletState;
    } catch (err) {
        console.error("Error retrieving wallet state:", err);
        throw err;
    }
}

// Fetch Last Block with Caching
async function getLastBlockCached(client) {
    const cacheKey = "lastBlock";

    // Check if the last block is cached
    const cachedBlock = cache.get(cacheKey);
    if (cachedBlock) {
        console.log("Returning cached last block...");
        return cachedBlock;
    }

    try {
        console.log("Fetching last block...");
        const lastBlock = await client.getLastBlock();
        cache.set(cacheKey, lastBlock); // Cache the block
        return lastBlock;
    } catch (err) {
        console.error("Error fetching last block:", err);
        throw err;
    }
}

// Send TON Transfer
async function sendTonTransfer(client, mnemonics, recipientAddress, amount) {
    try {
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        const walletState = await getWalletStateCached(client, mnemonics);
        const seqno = walletState.seqno;

        console.log("Seqno for Transfer:", seqno);

        // Send transfer
        await contract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [internal({
                value: amount,
                to: recipientAddress,
                body: 'Automated transfer via Telegram Bot',
            })],
        });

        console.log(`Successfully sent ${amount} TON to ${recipientAddress}`);
    } catch (err) {
        console.error("Error sending TON transfer:", err);
        throw err;
    }
}

// Example Usage
(async () => {
    const endpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";
    const apiKey = "5ba494fc5174eb060fa02740785437c9eac28efd11301eed0136fd8dc997783d";
    const mnemonics = "spend climb brother enjoy convince speed prosper sight ghost rapid purpose client decide retreat settle stock carpet lunar find exist exact must explain actor".split(" ");

    const client = initTonClient(apiKey, endpoint);

    // Fetch Wallet State
    const recipientAddress = "EQBbwxC0WnOlXVwC5a8SEwd-_jtg3d3YCt0th_VA4IC9NkDS";
    const walletState = await getWalletStateCached(client, mnemonics);
    console.log("Wallet State:", walletState);
	
	/*
    // Fetch Last Block (Demonstrating Cache Use)
    const lastBlock = await getLastBlockCached(client);
    console.log("Last Block:", lastBlock);
	*/

    // Send Transfer
    await sendTonTransfer(client, mnemonics, recipientAddress, "0.6");
})();

