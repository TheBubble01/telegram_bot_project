import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

// Initialize TON Client
function initTonClient(apiKey, endpoint) {
    return new TonClient({
        endpoint,
        apiKey, // Provide the API key for faster requests
    });
}

// Retrieve Wallet State
async function getWalletState(client, mnemonics) {
    try {
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        const seqno = await contract.getSeqno();
        const balance = await contract.getBalance();

        console.log("Seqno:", seqno);
        console.log("Balance:", balance.toString(), "nanoTON");

        return { seqno, balance: balance.toString() };
    } catch (err) {
        console.error("Error retrieving wallet state:", err);
        throw err;
    }
}

// Helper Function to Fetch Latest Transactions
async function fetchLatestTransaction(client, walletAddress) {
    const block = await client.call("getMasterchainInfo", {}); // Fetch the masterchain info
    console.log("Fetched Masterchain Info:", block);

    const result = await client.call("getTransactions", {
        address: walletAddress.toString(),
        limit: 1, // Fetch the latest transaction only
    });

    if (result.length > 0) {
        return result[0].transactionId.hash;
    } else {
        throw new Error("No transactions found.");
    }
}

// Send TON Transfer
async function sendTonTransfer(client, mnemonics, recipientAddress, amount) {
	try {
        	const keyPair = await mnemonicToPrivateKey(mnemonics);
        	const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        	const contract = client.open(wallet);
		const seqno = await contract.getSeqno();
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

		// Fetch Transaction Hash
		/*
		console.log("Fetching transaction details...");
		const transactionHash = await fetchLatestTransaction(client, wallet.address);
		console.log("Transaction Hash:", transactionHash);

		return transactionHash;
		*/
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

	const client = new TonClient({ endpoint, apiKey });

	// Fetch Wallet State
	const recipientAddress = "EQBbwxC0WnOlXVwC5a8SEwd-_jtg3d3YCt0th_VA4IC9NkDS";
	const walletState = await getWalletState(client, mnemonics);
	console.log("Wallet State:", walletState);

	// Send Transfer and Get Transaction Hash
	const transactionHash = await sendTonTransfer(client, mnemonics, recipientAddress, "0.6");
	//console.log("Final Transaction Hash:", transactionHash);
})();

