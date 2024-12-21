const { TonClient4 } = require("ton");

(async () => {
    const tonAccessEndpoint = "https://ton.access.orbs.network/4410c0ff5Bd3F8B62C092Ab4D238bEE463E64410/1/testnet/ton-api-v4";
    const toncenterEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";

    try {
        console.log("Testing Ton Access Endpoint...");
        const clientTonAccess = new TonClient4({ endpoint: tonAccessEndpoint });
        const blockTonAccess = await clientTonAccess.getLastBlock();
        console.log("Ton Access Block:", blockTonAccess);

        console.log("Testing Toncenter Endpoint...");
        const clientToncenter = new TonClient4({ endpoint: toncenterEndpoint });
        const blockToncenter = await clientToncenter.getLastBlock();
        console.log("Toncenter Block:", blockToncenter);
    } catch (err) {
        console.error("Error testing endpoints:", err);
    }
})();

