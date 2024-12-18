const { mnemonicToWalletKey } = require("@ton/crypto");

async function deriveKeyFromMnemonic(seedPhrase) {
    try {
        const key = await mnemonicToWalletKey(seedPhrase.split(" "));
        console.log("Private Key (Hex):", Buffer.from(key.secretKey).toString("hex"));
        console.log("Public Key (Hex):", Buffer.from(key.publicKey).toString("hex"));
    } catch (error) {
        console.error("Error deriving key:", error.message);
    }
}

// Replace with your 24-word seed phrase
deriveKeyFromMnemonic(
    "spend climb brother enjoy convince speed prosper sight ghost rapid purpose client decide retreat settle stock carpet lunar find exist exact must explain actor"
);

