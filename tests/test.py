from web3 import Web3

PROVIDER_URL = "https://sepolia.infura.io/v3/ab435a885a114035bb2c5ca54dd67dd9"
web3 = Web3(Web3.HTTPProvider(PROVIDER_URL))

if web3.is_connected():
    print("Connected to Sepolia Testnet.")
else:
    print("Failed to connect to the blockchain.")

