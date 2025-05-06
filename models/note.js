const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    body: {
        type: String,
        require: true
    },
    folder: {
        type: String,
        require: false
    },
    color: {
        type: String,
        require: false
    },
    pinned: {
        type: Boolean,
        require: false
    },
    discard: {
        type: Boolean,
        require: false
    },
},{timestamps:true});

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;