var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var supplierSchema = new Schema({
    name: {
        type: String,
        required: true
    },
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