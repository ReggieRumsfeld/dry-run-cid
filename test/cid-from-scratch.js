const env = require('../config');
const fs = require('fs');
const { expect, assert } = require('chai')
    .use(require('chai-bytes'));
const dagPB = require('ipld-dag-pb')
const DAGNode = dagPB.DAGNode

const { localIpfsNode, ipfsInfura } = require('../src/ipfs-instances');
let repo = env.IPFS_NODE_FOLDER;
const ipfsLocal = localIpfsNode(repo);

const { assetToIPFS, ipfsGet, dagGet, createCid } = require('../src/ipfs-interaction');


// URL to File > 256KB - Working with Blocks; https://docs.ipfs.io/how-to/work-with-blocks/#what-to-do-with-blocks
const FileURL = env.LARGE_FILE;
// File buffer
let buffer;
// required for comparison in the second "describe"
let localDag;

function dagData(dag) {
    if (!Buffer.isBuffer(dag.Data)) return Buffer.from(dag.Data)
    return dag.Data
}

function sliceAddLink(buffer2Slice, dagNode) {
    return new Promise(async function(resolve, reject) {
        try {
            while (buffer2Slice.length > 0) {
                let slice = buffer2Slice.slice(0, 262144);
                //console.log("Slice: ", slice)
                buffer2Slice = buffer2Slice.slice(262144);
                sliceAddResult = await createCid(slice, ...[, , ], 85);
                //sliceAddResult = await assetToIPFS(slice, ipfs);
                //console.log("Slice ADD: ", sliceAddResult);
                let link = { Tsize: slice.length, Hash: sliceAddResult };
                dagNode.addLink(link);
            }
            resolve(dagNode)
        } catch (err) {  reject(err) }
    })
}

before(function(done) {
    fs.readFile(FileURL, function(err, fileContents) {
        if (err) throw err;
        buffer = fileContents;
        done();
    });
});

describe("Get DAG TREE from Data add via local offline node", function() {
    let _ipfsInfura;
    let localAddResult;


    it("Assert large File Buffer", function() {
        assert(buffer.length > 262144, "Not a large file")
    })

    it("Spawn offline NODE programmatically and add File", async function() {
        _ipfsLocal = await ipfsLocal;
        assert(_ipfsLocal.ipns.options.offline, "Connected to IPFS")
        localAddResult = await assetToIPFS(buffer, _ipfsLocal);
        assert(localAddResult.size >= buffer.length, "should be larger then bytes length of File")
    })

    it("Adding publicly yields the same CID result", async function() {
        // longer then standard time out because of interaction with public IPFS gateway 
        this.timeout(6000);
        _ipfsInfura = await ipfsInfura;
        let addResult = await assetToIPFS(buffer, _ipfsInfura)
        assert.equal(localAddResult.cid.toString(), addResult.cid.toString(), "Different CIDS! (expected same)")
        assert.equal(localAddResult.size, addResult.size, "Expected same size!")
    })

    it("Gets the file publicly (with CID from local add), result equals original input", async function() {
        this.timeout(6000);
        let result = await ipfsGet(localAddResult.cid.toString(), _ipfsInfura)
        assert(result.length > 0, "Expected result to have length")
        assert.equal(result.length, buffer.length, "expected same length")
        assert.equalBytes(result, buffer, "Result should be the same as the original input")
    })

    // Differences in DAG-PB object representation in Infura and Local node!
    it("dag_get local and dag_get infura yield the same Data and Links array", async function() {
        this.timeout(6000);
        let cid = localAddResult.cid
        localDag = await dagGet(cid, _ipfsLocal);
        let infuraDag = await dagGet(cid, _ipfsInfura);
        console.log("Local DAG: ", localDag.value);
        console.log("Infura DAG: ", infuraDag.value);
        // Differences in DAG-PB object representation in Infura and Local node
        // Data is Buffer in localDag and uint8array in infuraDag  
        assert.equalBytes(await dagData(localDag.value), await dagData(infuraDag.value), 'Expected Equal Data')
        assert.equal(infuraDag.value.Links.length, localDag.value.Links.length, "Expected same amount of children")
        assert(localDag.value.Links.length > 0, "Should have children (DAG-LINK objects)")
        for (i = 0; i < localDag.value.Links.length; i++) {
            assert.equal(infuraDag.value.Links[i].Hash.toString(), localDag.value.Links[i].Hash.toString())
        }
    })

    it("reconstruct cid from dag and compare to add result", async function() {
        let serialized = await dagPB.util.serialize(localDag.value)
        let cid = await dagPB.util.cid(serialized)
        console.log("CID_from_get_DAG: ", cid)
        assert.equal(cid.toString(), localAddResult.cid.toString(), "Expected the same CID")
    })

    after(async() => {
        await _ipfsLocal.stop()
            // TODO: Remove local node's files
            //await _ipfsInfura.stop()
        console.log("Local Add Result: ", localAddResult)
    })
})

// BASED on a succesful Describe above, using root dag node retrieved from the local node as the benchmark to recreate

describe("Create DAG-PB root from scratch", function() {
    let dagNode;
    it("Creates root DAG NODE", async function() {
        this.timeout(6000);
        dagNode = await sliceAddLink(buffer, new DAGNode(), await ipfsInfura)
            //assert(dagNode.Links.length > 0, "Should have Children/DAG-LINKS")
        assert.equal(dagNode.Links.length, localDag.value.Links.length, "Expected same amount of children in created, as in retrieved DAG ")
        for (i = 0; i < dagNode.Links.length; i++) {
            console.log("Children Strings: ", dagNode.Links[i].Hash.toString())
            assert.equal(dagNode.Links[i].Hash.toString(), localDag.value.Links[i].Hash.toString(), "Children's CID should be same")
        }
        console.log(dagNode)
    })

})