var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// This could be used for non-international version of the app
// const statesArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

var customerSchema = new Schema({
    name: {
        first: String,
        last: String
    },
    email: String,
    address: {
        street: String,
        city: String,
        state: {
            type: String,
            uppercase: true,
            required: true,
            // enum: statesArray
        },
        country: {
            type: String,
            required: true
        },
        zip: Number
    }
});

var Customers = mongoose.model('Customers', customerSchema);

module.exports = Customers;