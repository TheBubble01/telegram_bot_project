import { TonClient, WalletContractV4 } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

async function getWalletState(mnemonics, endpoint) {
    try {
        
	// Initialize TON client
	const client = new TonClient({
    		endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    		apiKey: '5ba494fc5174eb060fa02740785437c9eac28efd11301eed0136fd8dc997783d', // Replace with your valid API key
});
    

	console.log("Connected to TON Blockchain.");

        // Convert mnemonics to private key
        const keyPair = await mnemonicToPrivateKey(mnemonics);
        console.log("Private Key: ", keyPair.secretKey.toString('hex'));

        // Create wallet contract
        const workchain = 0; // Workchain is usually 0
        const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
        const contract = client.open(wallet);

        // Retrieve wallet state
        const seqno = await contract.getSeqno();
        console.log("Seqno: ", seqno);

        const balance = await contract.getBalance();
        console.log("Balance: ", balance.toString(), "nanoTON");

        return { seqno, balance: balance.toString() };
    } catch (error) {
        console.error("Error retrieving wallet state: ", error);
        throw error;
    }
}

// Example Usage
const mnemonics = "spend climb brother enjoy convince speed prosper sight ghost rapid purpose client decide retreat settle stock carpet lunar find exist exact must explain actor".split(" ");
const endpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";

getWalletState(mnemonics, endpoint)
    .then(state => console.log("Wallet State: ", state))
    .catch(error => console.error("Failed to retrieve wallet state."));

