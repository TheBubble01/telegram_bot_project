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

// Retry Logic
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            console.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
            } else {
                throw err; // Exhausted retries
            }
        }
    }
}

// Retrieve Wallet State with Parallel Requests
async function getWalletStateBatch(client, mnemonics) {
    const cacheKey = "walletState";
    const cachedState = cache.get(cacheKey);

    if (cachedState) {
        console.log("Returning cached wallet state...");
        return cachedState;
    }

    try {
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        console.log("Fetching wallet state with parallel requests...");
        const [seqno, balance] = await Promise.all([
            contract.getSeqno(),  // Fetch seqno
            contract.getBalance() // Fetch balance
        ]);

        const walletState = { seqno, balance: balance.toString() };
        cache.set(cacheKey, walletState); // Cache the state
        return walletState;
    } catch (err) {
        console.error("Error retrieving wallet state:", err);
        throw err;
    }
}

// Send TON Transfer
async function sendTonTransfer(client, mnemonics, recipientAddress, amount) {
    try {
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        const walletState = await getWalletStateBatch(client, mnemonics);
        const seqno = walletState.seqno;

        console.log("Seqno for Transfer:", seqno);

        // Send transfer with retry logic
        await withRetry(async () => {
            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [internal({
                    value: amount,
                    to: recipientAddress,
                    body: 'Automated transfer via Telegram Bot',
                })],
            });
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
    const walletState = await getWalletStateBatch(client, mnemonics);
    console.log("Wallet State:", walletState);

    // Send Transfer
    await sendTonTransfer(client, mnemonics, recipientAddress, "0.6");
})();

