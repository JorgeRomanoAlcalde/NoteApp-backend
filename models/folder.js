const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const folderSchema = new Schema({
    folder: {
        type: String,
        require: true
    }
},{timestamps:true});

const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;