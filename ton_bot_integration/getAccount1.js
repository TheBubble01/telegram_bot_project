const fetch = require("node-fetch");
const { Address } = require("ton");

async function getAccountState(endpoint, address, block) {
    try {
        // Make sure address is in the correct format
        const formattedAddress = address.toString();
        console.log("Querying address:", formattedAddress); // Add this for debugging
        
        const response = await fetch(`${endpoint}/address/${formattedAddress}/account`);
        if (!response.ok) {
            throw new Error(`Failed to fetch account state: ${response.statusText}`);
        }
        const accountState = await response.json();
        console.log("Account State via RPC:", accountState);
        return accountState;
    } catch (err) {
        console.error("Error fetching account state via RPC:", err);
        throw err;
    }
}

(async () => {
    const endpoint = "https://ton.access.orbs.network/4410c0ff5Bd3F8B62C092Ab4D238bEE463E64410/1/mainnet/ton-api-v4";

    try {
        console.log("Fetching last block...");
        const lastBlockResponse = await fetch(`${endpoint}/block/latest`);
        if (!lastBlockResponse.ok) {
            throw new Error(`Failed to fetch last block: ${lastBlockResponse.statusText}`);
        }
        const lastBlock = await lastBlockResponse.json();
        console.log("Last Block:", lastBlock);

        const senderWalletAddress = Address.parseFriendly("EQBbwxC0WnOlXVwC5a8SEwd-_jtg3d3YCt0th_VA4IC9NkDS").address;
        console.log("Fetching account state...");
        const accountState = await getAccountState(endpoint, senderWalletAddress, lastBlock.last);
        console.log("Account State:", accountState);
    } catch (err) {
        console.error("Error:", err);
    }
})();
