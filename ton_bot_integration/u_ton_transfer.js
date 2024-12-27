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
                const backoff = delay * Math.pow(2, i); // Exponential backoff
                await new Promise((resolve) => setTimeout(resolve, backoff));
            } else {
                console.log("Transaction is delayed due to network issues. Please try again later.");
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
export async function sendTonTransfer(client, mnemonics, recipientAddress, amount) {
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
            console.log(`Successfully sent ${amount} TON to ${recipientAddress}`);
        });

    } catch (err) {
        console.error("Error sending TON transfer:", err);
        throw err;
    }
}

// Initialize the TON Client and Return It
export function initializeClient(apiKey, endpoint) {
    return initTonClient(apiKey, endpoint);
}

// Example Usage (commented out to be triggered externally)
/*
(async () => {
    const endpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";
    const apiKey = "YOUR_API_KEY_HERE";
    const mnemonics = "YOUR_MNEMONIC_HERE".split(" ");

    const client = initializeClient(apiKey, endpoint);

    // Dynamically passed values
    const recipientAddress = "DYNAMIC_WALLET_ADDRESS";
    const amount = "DYNAMIC_AMOUNT";

    // Fetch Wallet State
    const walletState = await getWalletStateBatch(client, mnemonics);
    console.log("Wallet State:", walletState);

    // Send Transfer
    await sendTonTransfer(client, mnemonics, recipientAddress, amount);
})();
*/

