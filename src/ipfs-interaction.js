'use strict'
/*=========================================
===   INTERACTING WITH IPFS INSTANCES =====
=========================================*/

//To create CID instances
const CID = require('cids');
const multiHashing = require('multihashing-async');

// Using the following ADD options
const cidOptions = {
    cidVersion: 1, // ipfs.add default = 0 
    hashAlg: 'sha2-256',
    code: 112
}

/*
async function hashFile(content) {
    return await multiHashing(content, cidOptions.hashAlg)
}
*/

/**
 * @note Primarily used in the creation of DAG-LINK
 * @param {*} content Buffer, to be hashed
 */
/*
async function setUpCid(content) {
    let fileHash = await hashFile(content)
        // Content of children is hashed as "Raw" / code: 85 (?), hence deviating from the preset
    let cid = new CID(cidOptions.cidVersion, 85, fileHash)
    return cid
}
*/

/**
 * 
 * @param {Buffer} content 
 * @param {string} [hashAlg] // optional 
 * @param {number} [cidVersion] // optional 
 * @param {number} [cidCode] // optional - should be set to 85 in creating DAG-LINK
 */
async function createCid(content, hashAlg, cidVersion, cidCode) {
    hashAlg = hashAlg || cidOptions.hashAlg;
    cidVersion = cidVersion || cidOptions.cidVersion
    cidCode = cidCode || cidOptions.code
    let fileHash = await multiHashing(content, hashAlg)
    return new CID(cidVersion, cidCode, fileHash)
}

/**
 * @note ipfs.add with the preset options
 * @param {*} content Buffer (of File) to be published 
 * @param {*} ipfs The ipfs instance involved
 */
async function assetToIPFS(content, ipfs) {
    let result = await ipfs.add(content, cidOptions)
    return result;
}

/**
 * @note Getting data from the IPFS network (thru a node instance)
 * The chunks from the get result are concatted into one buffer
 * @param {*} path The CID.toString() of the data to get
 * @param {*} ipfs The ipfs instance involved
 */
async function ipfsGet(path, ipfs) {
    // Empty Buffer to kick-off concatting
    let data = Buffer.from('');
    for await (const file of ipfs.get(path)) {
        if (!file.content) continue;
        for await (const chunk of file.content) {
            //concatting the chunks (Buffers) coming in 
            let arr = [data, Buffer.from(chunk)]
            data = Buffer.concat(arr)
        }
        return data
    }
}

/**
 * @note getting Dag-PB Node from specific CID and IPFS instance
 * The representation of DAG-PB differs per IPFS node 
 * (e.g. diff between infura and the local node used here)
 * @param {*} cid 
 * @param {*} ipfs 
 */
async function dagGet(cid, ipfs) {
    return await ipfs.dag.get(cid)
}

module.exports = {
    assetToIPFS,
    ipfsGet,
    dagGet,
    //setUpCid,
    createCid
}