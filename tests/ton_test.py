import requests

# Toncenter public API URL
API_URL = "https://toncenter.com/api/v2"

# Test connection to TON blockchain
def get_blockchain_info():
    url = f"{API_URL}/getMasterchainInfo"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        print("Connected to TON Blockchain.")
        print("Blockchain Info:", data)
    else:
        print("Failed to connect to TON. Status Code:", response.status_code)
        print("Error:", response.text)

if __name__ == "__main__":
    get_blockchain_info()

