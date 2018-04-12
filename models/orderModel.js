var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var orderSchema = new Schema({
    make: String,
    model: String,
    package: String,
    customer: {
        type: Schema.Types.ObjectId,
        ref: "Customers"
    },
    supplier: {
        type: Schema.Types.ObjectId,
        ref: "Suppliers"
    },
    supplier_order_id: {
        type: Number,
        index: true
    }
});

var Orders = mongoose.model('Orders', orderSchema);

module.exports = Orders;