'use strict'

const { localIpfsNode, ipfsInfura } = require('./ipfs-instances');
const {
    assetToIPFS,
    ipfsGet,
    dagGet,
    createCid
} = require('./ipfs-interaction');


module.exports = {
    localIpfsNode,
    ipfsInfura,
    assetToIPFS,
    ipfsGet,
    dagGet,
    createCid
}