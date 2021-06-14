'use strict'

//////////////////////////
// INFURA IPFS instance //
//////////////////////////

const IPFS_INFURA = require('ipfs-http-client');
const ipfsInfura = IPFS_INFURA.create(({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }));

/////////////////////////////////
// LOCAL/OFFLINE IPFS instance //
/////////////////////////////////

// Currently using OFFLINE IPFS node to get an accurate CID without publishing data to IPFS
// IMO this is needed, to avoid the risk of front-running, based on IPFS publication:
// IPFS nodes/services "announce" to have certain files available ( with PIN services this might happen before the transaction is thru)
// Desired Flow: Predict CID Data - Transact CID Data on chain - Publish content to IPFS
const IPFS_LOCAL = require('ipfs-core');

/**
 * 
 * @param {*} repo Local node's repo location (within your project)
 */
function localIpfsNode(repo) {
    return IPFS_LOCAL.create({ offline: true, repo: repo })
}

module.exports = { localIpfsNode, ipfsInfura }