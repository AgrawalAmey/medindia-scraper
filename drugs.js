var mongoose = require('mongoose');

// define the schema for drugs
var drugsSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    url: String,
    brands: [String],
    added: {
        type: Date,
        default: Date.now
    },
    lastUpdated: Date
});

// create the model for drugs and expose it
module.exports = mongoose.model('drugs', drugsSchema);
