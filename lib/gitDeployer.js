const { exec } = require('child_process');
const fs = require('fs');
const dir = './gitDeployer';
const GraphDeployer = require("./graphDeployer");


module.exports = class extends GraphDeployer {

    constructor(name, graphNode, graphIndexNode, protocol, host, port, authToken, gitRepo, branch = "master", fileName = "offchain-subgraphs.txt") {
        super(name, graphNode, graphIndexNode, protocol, host, port, authToken);
        this.gitRepo = gitRepo;
        this.branch = branch;
        this.fileName = fileName;
    }

    async deploySubgraph(hash) {

        const callback = async () => {
            return new Promise(resolve => {
                exec(`${hash} >> ./repos/${this.name}/${this.fileName}`, async (err, stdout) => {
                    this.commitChange(`added ${hash} to ${this.name}`);
                    resolve(true);
                })
            })
        }

        if (!fs.existsSync(`./repos/${this.name}`)) {
            exec(`git clone -b ${this.branch} ${this.gitRepo} ./repos/${this.name}`, callback)
        } else {
            exec(`cd repos/${this.name} && git pull origin ${this.branch}`, callback)
        }
    }

    async removeSubgraph(hash) {
        return new Promise(resolve => {
            exec(`sed '/${hash}/d' ./repos/${this.name}/${this.fileName}`, async (err, stdout) => {
                await this.commitChange(`removed ${hash} from ${this.name}`);
            })
        })
    }

    async commitChange(msg) {
        return new Promise(resolve => {
            exec(`cd ./repos/${this.name} && git ci -a -m ${msg}`, (err, stdout) => {
                exec(`cd ./repos/${this.name} && git push origin ${this.branch}`, (err, stdout) => {
                    resolve(true);
                })
            })
        })
    }
}