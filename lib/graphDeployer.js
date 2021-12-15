const jayson = require("jayson");
const apollo = require("apollo-fetch");
const level = require("level");

module.exports = class {

    constructor(name, graphNode, graphIndexNode, protocol = "https", host = "graphnode", port = 8020, authToken = false) {
        this.name = name;
        this.protocol = protocol;
        this.host = host;
        this.port = port;
        this.graphNode = graphNode;
        this.graphIndexNode = graphIndexNode;

        if(this.protocol == "https") {
            this.graphClient = jayson.Client.https({
                host,
                port
            });    
        } else if (this.protocol == "http") {
            this.graphClient = jayson.Client.http({
                host,
                port
            });   
        }
        
        if(authToken !== false) {
            // @ts-ignore
            this.graphClient.options.headers = { Authorization: `Bearer ${authToken}`}
        }

        this.db = level(`${this.name}-level-db`);
    }

    deploySubgraph(hash) {
        const name = `${this.name}/${hash.substring(hash.length - 6)}`;
        return new Promise((resolve) => {
            this.graphClient.request("subgraph_create", {name}, "2", (err, resp) => {
                console.log(err, resp);
                this.graphClient.request("subgraph_deploy", {name, ipfs_hash: hash}, "2", (err, resp) => {
                    console.log(err, resp);
                    resolve(true);
                })
            })
        })
    }

    removeSubgraph(hash) {
        const name = `${this.name}/${hash.substring(hash.length - 6)}`;
        this.graphClient.request("subgraph_remove", {name}, "2", (err, resp) => {
            console.log(err, resp);
        })
    }

    async isSynced(hash) {
        const graphIndexClient = apollo.createApolloFetch({uri: `${this.graphIndexNode}/graphql`})
        const query = `{ indexingStatuses(subgraphs: ["${hash}"]) {
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
    
        const { data } = await graphIndexClient({query});
        return data;
    }

    getServer() {
        return this.graphNode;
    }
}