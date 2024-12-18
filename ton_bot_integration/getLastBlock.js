const { TonClient4 } = require("ton");
const { getHttpV4Endpoint } = require("@orbs-network/ton-access");

(async () => {
    try {
        const endpoint = await getHttpV4Endpoint({ network: "testnet" });
        const client = new TonClient4({ endpoint });

        console.log("Fetching last block...");
        const result = await client.getLastBlock();
        console.log("Last Block:", result);
    } catch (err) {
        console.error("Error fetching last block:", err);
    }
})();

