require('dotenv').config();

const GitDeployer = require("./lib/gitDeployer");
const GraphDeployer = require("./lib/graphDeployer");

// const stakeSquidDeployer = new GitDeployer(
//     "stakesquid", 
//     "",
//     "https",
//     "graphnode",
//     "8030",
//     false,
//     "git@github.com:StakeSquid/offchain-subgraph.git",
//     "master",
//     "offchain-subgraphs.txt"
// )


const devNodeDeployer = new GraphDeployer(
    "dev-node", 
    "http://graphnode:8000",
    "http://graphnode:8030",
    "http",
    "graphnode", 
    8020, 
    // @ts-ignore
    "1234"
)

const ethers = require("ethers");
const artifact = require("./abis/Registry.json")
const address = process.env.REGISTRY_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log(signer.getAddress());


async function main() {
    const Contract = new ethers.Contract(address, artifact.abi, signer);
    const contract = await Contract.deployed();
    let hash = "";
    contract.on("SubgraphPublished", async (_name, _hash) => {
        console.log(_name, _hash);
        try {
            await Promise.all([
                // stakeSquidDeployer.deploySubgraph(_hash)
                //     .then(_ =>  stakeSquidDeployer.isSynced(_hash))
                //     .then(_ => contract.subgraphSynced(_name, _hash, stakeSquidDeployer.getServer()))
                //     .then(_ => stakeSquidDeployer.removeSubgraph(hash)),
                devNodeDeployer.deploySubgraph(_hash)
                    .then(_ => devNodeDeployer.isSynced(_hash))
                    .then(_ => contract.subgraphSynced(_name, _hash, devNodeDeployer.graphNode))
                    .then(_ => hash !== _hash ? devNodeDeployer.removeSubgraph(hash) : "")
            ]);
            // replace old hash with new hash
            hash = _hash;
        } catch(e) {
            console.error(e.message);
        }
    })
}
main();
