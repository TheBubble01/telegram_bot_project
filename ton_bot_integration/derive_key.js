const { mnemonicToWalletKey } = require("@ton/crypto");

async function deriveKeyFromMnemonic(seedPhrase) {
    try {
        const key = await mnemonicToWalletKey(seedPhrase.split(" "));
        const privateKey = Buffer.from(key.secretKey).toString("hex").slice(0, 64); // Extract first 64 characters
        console.log("Private Key (Hex):", privateKey);
        console.log("Public Key (Hex):", Buffer.from(key.publicKey).toString("hex"));
    } catch (error) {
        console.error("Error deriving key:", error.message);
    }
}

// Replace with your 24-word seed phrase
deriveKeyFromMnemonic(
    "spend climb brother enjoy convince speed prosper sight ghost rapid purpose client decide retreat settle stock carpet lunar find exist exact must explain actor"
);

