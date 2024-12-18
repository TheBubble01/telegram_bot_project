const fetch = require("node-fetch");

(async () => {
    const endpoint = "https://ton.access.orbs.network/4410c0ff5Bd3F8B62C092Ab4D238bEE463E64410/1/testnet/ton-api-v4";
    try {
        const response = await fetch(`${endpoint}/block/latest`);
        if (response.ok) {
            const data = await response.json();
            console.log("Decentralized Endpoint Response:", data);
        } else {
            console.error("Decentralized Endpoint Error:", response.statusText);
        }
    } catch (err) {
        console.error("Error testing decentralized endpoint:", err);
    }
})();

