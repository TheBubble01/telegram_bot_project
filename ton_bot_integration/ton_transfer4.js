const { TonClient4, WalletContractV4, SendMode, Address, toNano } = require("ton");
const { getHttpV4Endpoint } = require("@orbs-network/ton-access");
const { keyPairFromSeed } = require("@ton/crypto");

async function fetchAccountStateDirectly(client, address) {
    try {
	console.log("Fetching last block...");
        const result = await client.getLastBlock();
	if (!result || !result.last) {
		throw new Error("Failed to retrieve the last block.");
	}

	console.log("Last Block:", result);
	
	console.log("Fetching account state...");
        const account = await client.getAccount({
            address: address,
            block: result.last,
        });
        console.log("Direct RPC Account State:", account);
        return account;
    } catch (err) {
        console.error("Error fetching account state directly:", err);
        throw err;
    }
}

async function sendTon(senderPrivateKeyHex, recipientAddress, amount) {
    try {
        // Step 1: Connect to a decentralized RPC node
        const endpoint = await getHttpV4Endpoint({ network: "testnet" });
        const client = new TonClient4({ endpoint });

        // Step 2: Generate key pair from private key
        const senderPrivateKey = Buffer.from(senderPrivateKeyHex, "hex");
        const keyPair = keyPairFromSeed(senderPrivateKey);
        console.log("Key Pair:", keyPair);

        // Step 3: Parse the recipient address
        const recipient = Address.parseFriendly(recipientAddress).address;
        console.log("Recipient Address:", recipient.toString());

        // Step 4: Initialize the wallet
        const senderWallet = WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });

        const senderWalletAddress = senderWallet.address;
        console.log("Sender Wallet Address:", senderWalletAddress.toString());

        // Step 5: Fetch seqno with fallback
        let seqno = 0;
        try {
            seqno = await senderWallet.getSeqno(client);
            console.log("Seqno:", seqno);
        } catch (err) {
            console.error("Error retrieving seqno with WalletContractV4, trying direct RPC fallback...");
            const accountState = await fetchAccountStateDirectly(client, senderWalletAddress);
            seqno = accountState.account?.state?.seqno || 0;
            console.log("Fallback Seqno:", seqno);
        }

        // Step 6: Create the transfer message
        const transferMessage = senderWallet.createTransfer({
            seqno: seqno,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            messages: [
                {
                    to: recipient,
                    value: toNano(amount), // Convert TON to nanotons using toNano
                    bounce: false,
                },
            ],
        });

        // Step 7: Send the signed transaction
        const result = await client.sendExternalMessage(senderWallet, transferMessage);
        console.log("Transaction successful!", result);
    } catch (err) {
        console.error("Error sending TON:", err);
    }
}

// Command-line arguments for Python integration
const args = process.argv.slice(2);
if (args.length === 3) {
    const [senderPrivateKey, recipientAddress, amount] = args;
    sendTon(senderPrivateKey, recipientAddress, parseFloat(amount));
} else {
    console.log("Usage: node ton_transfer.js <privateKey> <recipientAddress> <amount>");
}
