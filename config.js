const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    // variables from .env
    SMALL_FILE: process.env.SMALL_FILE,
    LARGE_FILE: process.env.LARGE_FILE,
    LARGEST_FILE: process.env.LARGEST_FILE,
    IPFS_NODE_FOLDER: process.env.IPFS_NODE_FOLDER

};