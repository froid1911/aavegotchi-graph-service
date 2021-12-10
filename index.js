require('dotenv').config();
const ethers = require("ethers");
const artifact = require("./abis/Registry.json")
const address = process.env.REGISTRY_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_URL);
const graphIndexNode = process.env.GRAPH_INDEX_NODE
const jayson = require("jayson");
const apollo = require("apollo-fetch");

const graphIndexClient = apollo.createApolloFetch({uri: graphIndexNode})

const graphClient = jayson.Client.http({
    host: "graphnode",
    port: 8020
});

// @ts-ignore
graphClient.options.headers = { Authorization: 'Bearer 1234'}


const Contract = new ethers.Contract(address, artifact.abi, provider);

async function isSynced(_hash) {
    let query = `{ indexingStatuses(subgraphs: ["${_hash}"]) {
        synced
        subgraph
        health
        chains {
            chainHeadBlock {
                number
            }
            latestBlock {
                number
            }
        }
        fatalError {
            handler
        }
        entityCount
        node
    }}`;

    const {data} = await graphIndexClient({query});
}

async function removeSubgraph(name) {
    graphClient.request("subgraph_remove", {name}, "2", (err, resp) => {
        console.log(err, resp);
    })
}

async function deploySubgraph(name, hash) {
    return new Promise((resolve) => {
        graphClient.request("subgraph_create", {name}, "2", (err, resp) => {
            console.log(err, resp);
            graphClient.request("subgraph_deploy", {name, ipfs_hash: hash}, "2", (err, resp) => {
                console.log(err, resp);
                resolve(true);
            })
        })
    })
}







async function main() {

    const contract = await Contract.deployed();
    let hash = "";
    contract.on("SubgraphPublished", async (_name, _hash) => {
        await deploySubgraph(_name, _hash);
        await isSynced(_hash);
        await removeSubgraph(hash)
        // replace old hash with new hash
        hash = _hash;
    })

    
}

deploySubgraph("froid1911/aavegotchi-staking-faster", "QmRULSkFj5PF3YqqvmddKz74fqP3Vp7cBZAFm7PDMr3uxH")
