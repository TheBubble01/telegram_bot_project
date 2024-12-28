import { TonClient, WalletContractV4, internal } from "@ton/ton";
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
		//console.log("Connecting to TON Blockchain...");
		const keyPair = await mnemonicToPrivateKey(mnemonics);
		//console.log("Key Pair:", keyPair);
		
		// Open Wallet Contract
		const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
		const contract = client.open(wallet);
		//console.log("Wallet Address:", wallet.address.toString());
		
		// Fetch Wallet State
		const seqno = await contract.getSeqno();
		//console.log("Seqno:", seqno);
		
		// Send Transfer
		//console.log(`Sending ${amount} TON to ${recipient}...`);
		await contract.sendTransfer({
			seqno,
			secretKey: keyPair.secretKey,
			messages: [internal({
				value: amount,
				to: recipient,
				body: "Automated transfer via Telegram Bot",
			})],
		});

		console.log(`Sent ${amount} TON to "${recipient}"\nSee you next time!`);
	} catch (err) {
		console.error("Error during transaction:", err);
		process.exit(1);
	}
}

// Execute Main Function
main();

