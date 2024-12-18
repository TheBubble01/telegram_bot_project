const { TonClient4, WalletContractV4, SendMode, Address, beginCell } = require("ton");
const { getHttpV4Endpoint } = require("@orbs-network/ton-access");
const { keyPairFromSeed } = require("@ton/crypto");

async function sendTon(senderPrivateKeyHex, recipientAddress, amount) {
    try {
        // Step 1: Connect to a decentralized RPC node
        const endpoint = await getHttpV4Endpoint({ network: "testnet" });
        const client = new TonClient4({ endpoint });

        // Step 2: Generate key pair from private key
        const senderPrivateKey = Buffer.from(senderPrivateKeyHex, "hex");
        const keyPair = keyPairFromSeed(senderPrivateKey);

        // Step 3: Initialize the wallet
	const senderWalletAddress = Address.parseFriendly(recipientAddress).address;
	const senderWallet = new WalletContractV4({
            workchain: 0,
            publicKey: keyPair.publicKey,
            address: senderWalletAddress,
        });
        
	// Step 4: Fetch the sequence number (seqno) from the wallet state
	const seqno = await senderWallet.getSeqno(client);
	
        // Step 5: Create the transfer message
        const transferMessage = senderWallet.createTransfer({
            seqno: seqno,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            messages: [
                {
                    to: Address.parseFriendly(recipientAddress).address,
                    value: BigInt(amount * 1e9), // Convert TON to nanotons
                    bounce: false,
                },
            ],
        });

        // Step 6: Send the signed transaction
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

