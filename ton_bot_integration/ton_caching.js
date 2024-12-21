import NodeCache from "node-cache";
import axios from "axios";

// Initialize Cache (default TTL = 30 seconds)
const cache = new NodeCache({ stdTTL: 30 });

// Fetch last block with caching
export async function getLastBlockCached(endpoint) {
    const cacheKey = "lastBlock";

    // Check if the data exists in the cache
    const cachedBlock = cache.get(cacheKey);
    if (cachedBlock) {
        console.log("Returning cached last block...");
        return cachedBlock;
    }

    // Fetch from API if not cached
    console.log("Fetching last block from API...");
    const response = await axios.get(`${endpoint}/getMasterchainInfo`);
    if (response.data.ok) {
        const lastBlock = response.data.result;
        cache.set(cacheKey, lastBlock); // Cache the response
        return lastBlock;
    } else {
        throw new Error("Failed to fetch last block.");
    }
}

// Fetch wallet balance with caching
export async function getWalletStateCached(endpoint, walletAddress, apiKey) {
    const cacheKey = `walletState-${walletAddress}`;

    // Check if the data exists in the cache
    const cachedState = cache.get(cacheKey);
    if (cachedState) {
        console.log("Returning cached wallet state...");
        return cachedState;
    }

    // Fetch from API if not cached
    console.log("Fetching wallet state from API...");
    const response = await axios.get(`${endpoint}/getAddressInformation`, {
        params: { address: walletAddress, api_key: apiKey },
    });
    if (response.data.ok) {
        const walletState = response.data.result;
        cache.set(cacheKey, walletState); // Cache the response
        return walletState;
    } else {
        throw new Error("Failed to fetch wallet state.");
    }
}

