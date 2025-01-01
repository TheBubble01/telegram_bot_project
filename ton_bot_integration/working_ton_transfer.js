import { TonClient, WalletContractV4, internal, Address } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

// Parse command-line arguments
const args = process.argv.slice(2);
const apiKey = args[args.indexOf("--apiKey") + 1];
const endpoint = args[args.indexOf("--endpoint") + 1];
const mnemonics = args[args.indexOf("--mnemonics") + 1]?.split(" ");
const recipient = args[args.indexOf("--recipient") + 1];
const amount = args[args.indexOf("--amount") + 1];

// Validate inputs
if (!apiKey || !endpoint || !mnemonics || !recipient || !amount) {
    console.error("Missing required inputs. Ensure all parameters are provided.");
    process.exit(1);
}

// Initialize TON Client
const client = new TonClient({ endpoint, apiKey });

// Main Function
async function main() {
    try {
        // Generate Key Pair from Mnemonics
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        
        // Open Wallet Contract
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);
        
        // Parse Recipient Address
        const recipientAddress = Address.parse(recipient).toString({ bounceable: false });

        // Fetch Wallet State
        const seqno = await contract.getSeqno();

        // Send Transfer Without state_init
        await contract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    value: amount,
                    to: recipientAddress, // Non-bounceable recipient address
                    body: "The Bubble 001",//null,           // No payload, keeping it simple
                    bounce: false,        // Prevent bounce for uninit wallets
                }),
            ],
        });

        console.log(`Successfully sent ${amount} TON to "${recipient}" without bounce.`);
    } catch (err) {
        console.error("Error during transaction:", err);
        process.exit(1);
    }
}

// Execute Main Function
main();
