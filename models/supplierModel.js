var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var supplierSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    // this could also be placed in environment variable for security
    request_id: {
        type: String,
        required: true
    },
    api_url: {
        type: String,
        required: true
    },
    token_url: String
});

var Suppliers = mongoose.model('Suppliers', supplierSchema);

module.exports = Suppliers;