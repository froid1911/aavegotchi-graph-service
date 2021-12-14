require('dotenv').config();

const GitDeployer = require("./lib/gitDeployer");
const GraphDeployer = require("./lib/graphDeployer"):

const stakeSquidDeployer = new GitDeployer(
    "stakesquid", 
    "graphnode",
    "8030",
    false,
    "git@github.com:StakeSquid/offchain-subgraph.git",
    "master",
    "offchain-subgraphs.txt"
)

// @ts-ignore
const devNodeDeployer = new GraphDeployer("dev-node", "graphnode", 8030, "12345")

const ethers = require("ethers");
const artifact = require("./abis/Registry.json")
const address = process.env.REGISTRY_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_URL);

async function main() {
    const Contract = new ethers.Contract(address, artifact.abi, provider);
    const contract = await Contract.deployed();
    let hash = "";
    contract.on("SubgraphPublished", async (_name, _hash) => {
        console.log(_name, _hash);
        try {
            await Promise.all([
                stakeSquidDeployer.deploySubgraph(_hash).then(_ =>  stakeSquidDeployer.isSynced(_hash)).then(_ => stakeSquidDeployer.removeSubgraph(hash)),
                devNodeDeployer.deploySubgraph(_hash).then(_ => devNodeDeployer.isSynced(_hash)).then(_ => devNodeDeployer.removeSubgraph(hash))
            ]);
            // replace old hash with new hash
            hash = _hash;
        } catch(e) {
            console.error(e.message);
        }
    })
}
main();
