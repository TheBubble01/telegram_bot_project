import { TonClient, WalletContractV4, internal, Address } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

// Parse command-line arguments
const args = process.argv.slice(2);
const apiKey = args[args.indexOf("--apiKey") + 1];
const endpoint = args[args.indexOf("--endpoint") + 1];
const mnemonics = args[args.indexOf("--mnemonics") + 1]?.split(" ");
const recipient = args[args.indexOf("--recipient") + 1];
const amount = args[args.indexOf("--amount") + 1];
const retries = parseInt(args[args.indexOf("--retries") + 1]) || 3;
const delay = parseInt(args[args.indexOf("--delay") + 1]) || 1000;
const verbose = args.includes("--verbose");

// Validate inputs
if (!apiKey || !endpoint || !mnemonics || !recipient || !amount) {
    console.error("Missing required inputs. Ensure all parameters are provided.");
    process.exit(1);
}

if (mnemonics.length !== 24) {
    console.error("Invalid mnemonics: Expected 24 words.");
    process.exit(1);
}

if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    console.error("Invalid amount: Must be a positive number.");
    process.exit(1);
}

// Initialize TON Client
const client = new TonClient({ endpoint, apiKey });

// Helper Function: Retry Logic
async function withRetry(fn, retries, delay) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt < retries) {
                if (verbose) console.warn(`Attempt ${attempt} failed: ${err.message}`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw new Error(`Exhausted all ${retries} retries: ${err.message}`);
            }
        }
    }
}

// Main Function
async function main() {
    try {
        console.log("Connecting to TON Blockchain...");

        // Generate Key Pair from Mnemonics
        const keyPair = await mnemonicToPrivateKey(mnemonics);

        // Open Wallet Contract
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        console.log("Wallet Address:", wallet.address.toString());

        // Parse and Validate Recipient Address
        let recipientAddress;
        try {
            recipientAddress = Address.parse(recipient).toString({ bounceable: false });
        } catch (err) {
            throw new Error("Invalid recipient address format.");
        }

        console.log("Recipient Address (Non-Bounceable):", recipientAddress);

        // Fetch Wallet State
        console.log("Fetching seqno...");
        const seqno = await withRetry(() => contract.getSeqno(), retries, delay);
        console.log("Seqno:", seqno);

        // Send Transfer Without state_init
        console.log(`Sending ${amount} TON to ${recipientAddress}...`);
        await withRetry(
            () =>
                contract.sendTransfer({
                    seqno,
                    secretKey: keyPair.secretKey,
                    messages: [
                        internal({
                            value: amount,
                            to: recipientAddress,
                            body: null,
                            bounce: false,
                        }),
                    ],
                }),
            retries,
            delay
        );

        console.log(`Successfully sent ${amount} TON to "${recipientAddress}" without bounce.`);
    } catch (err) {
        console.error("Transaction failed:", err.message);
        process.exit(1);
    }
}

// Execute Main Function
main();

