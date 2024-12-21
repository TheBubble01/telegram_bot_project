from tonx.client import Client

# Initialize TON client with TON Access endpoint
#client = Client(base_url="https://ton-access-mainnet.orbs.network")
client = Client()

print("Connected to TON network", client)

"""
from tonx.wallet import Wallet

# Generate a new wallet
wallet = Wallet.create_new()
print(f"Wallet Address: {wallet.address}")
#print(f"Seed Phrase: {wallet.mnemonic}")  # Save this securely!
print(f"Private Key: {wallet.private_key}")
print(f"Public Key: {wallet.public_key}")
"""
