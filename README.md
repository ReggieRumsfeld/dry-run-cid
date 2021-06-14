# dry-run-cid
## Calculating CIDs without importing data into IPFS

### IPFS Privacy // NFT Front-Running 

Intro on the lack of [privacy of the IPFS Network](https://docs.ipfs.io/concepts/privacy/) :detective::alien: 

IPFS nodes emit announcements on the data they have stored and are reproviding. The [reprovider configuration](https://docs.ipfs.io/how-to/configure-node/) possibilities of an IPFS node are limited. The [docs](https://docs.ipfs.io/how-to/configure-node/) mention three "valid" strategies for announcement:

- announce all stored data
- only announce pinned data
- only announce directly pinned keys and root keys of recursive pins

Additionally one can set the interval for such announcements. A large part of the data/files will probably be added to the IPFS network through pinning service like [Piñata](https://pinata.cloud/). With such services, intervals for announcing pinned data will most likely be short.

A large number of Dapps use the IPFS to store, or least to determine/fix the content of certain assets. Resources on the danger of front-running / NFT frontrunning are quite limited, although such danger is probably not imaginary for DAPPS providing functionality like claiming Proof of Knowledge/ Copyright/ Provenance/ Ownership etc. Clearly, in such cases, the underlying data should not be (potentially) publicly available, before having been claimed on-chain :chains:

Note: The praxis has emerged to publish (potential) NFT material, long before any on-chain connection is made to its creator/owner(to save gas until actually needed, e.g. in the framework of a transfer). If the IPFS is used for publishing, this stuff is up for grabs :supervillain:


### Determining Content Identifiers

This repo intends to establish the relevant CIDs to be included in a transaction - such as the CID for the "asset" itself, and the tokenURI - without adding them to the IPFS network. A special concern are files [exceeding the block size](https://docs.ipfs.io/how-to/work-with-blocks/).

#### Files/Content < 256 KB

```bash
# Dependencies to create CID instances 
const CID = require('cids');
const multiHashing = require('multihashing-async');

# Options in establishing the CID 
const cidOptions = {
    cidVersion: 1, #ipfs.add default = 0 
    hashAlg: 'sha2-256', 
    code: 112
}

# Content to be passed as Buffer
async function createCid(content, hashAlg, cidVersion, cidCode) {
    hashAlg = hashAlg || cidOptions.hashAlg;
    cidVersion = cidVersion || cidOptions.cidVersion
    cidCode = cidCode || cidOptions.code
    let fileHash = await multiHashing(content, hashAlg)
    return new CID(cidVersion, cidCode, fileHash)
}
```

#### Files/Content > 256 KB

Working with larger files means [Working with Blocks](https://docs.ipfs.io/how-to/work-with-blocks/) tied together in a Merkle DAG tree. The "entry" CID of content contained in such a tree, is the CID of the root; the upmost DAG node in the tree/trie. Creating such CID from scratch, hence comes down creating a tree from scratch. Please have a :eyes: at the test file to see the steps involved.

### Getting CIDs from a local, offline node

Programmaticly spawning a local, offline node is very useful for testing the generated CIDs, without actually connecting to the IPFS network.

```bash
# js-ipfs' Core API dependency
const IPFS_LOCAL = require('ipfs-core');

# repo: the location of the IPFS node's repository within your project
function localIpfsNode(repo) {
    return IPFS_LOCAL.create({ offline: true, repo: repo })
}

# elsewhere 
async function workWithInstance(repo) {
   const ipfs = await localIpfsNode(repo)
   # do your stuff, then
   await ipfs.stop()

}
```
Using such offline node instances to establish the CID transactional data in production, is probably a bit of a hassle, since such [instances need to be managed](https://github.com/ipfs/js-ipfsd-ctl) (spawned, stopped, cleaned up :broom:), and you'll need to manage a multitude of instances.  

