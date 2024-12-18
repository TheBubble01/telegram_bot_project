const { TonClient4, Address } = require("ton");

(async () => {
    const endpoint = "https://ton.access.orbs.network/4410c0ff5Bd3F8B62C092Ab4D238bEE463E64410/1/testnet/ton-api-v4";
    const client = new TonClient4({ endpoint });

    try {
        console.log("Fetching last block...");
        const lastBlock = await client.getLastBlock();
        console.log("Last Block:", lastBlock);

        const senderWalletAddress = Address.parseFriendly("EQBbwxC0WnOlXVwC5a8SEwd-_jtg3d3YCt0th_VA4IC9NkDS").address;
        console.log("Fetching account state...");
        const accountState = await client.getAccount({
            address: senderWalletAddress,
            block: lastBlock.last,
        });
        console.log("Account State:", accountState);
    } catch (err) {
        console.error("Error retrieving account state:", err);
    }
})();

