var Suppliers = require('../models/supplierModel');
var Customers = require('../models/customerModel');
var Q = require('q');

function seedSuppliers() {
    var deferred = Q.defer();

    Suppliers.count({ name: 'ACME' }, function(err, count) {
        if (err) throw err;

        if (count > 0) {
            deferred.resolve();
        } else {
            var newSuppliers = [
                {
                    name: 'ACME',
                    request_id: 'cascade.53bce4f1dfa0fe8e7ca126f91b35d3a6',
                    api_url: 'http://localhost:3050/acme/api/v45.1/order'
                },
                {
                    name: 'Rainier',
                    request_id: 'ccas-bb9630c04f',
                    api_url: 'http://localhost:3051/rainier/v10.0/request_customized_model',
                    token_url: 'http://localhost:3051/rainier/v10.0/nonce_token'
                }
            ];
            Suppliers.create(newSuppliers, function(err, results) {
                if (err) {
                    console.log(err);
                    throw err;
                }
                deferred.resolve();
            });
        }
    });

    return deferred.promise;
}

function seedCustomers() {
    Customers.count({ 'name.first': 'John' }, function(err, count) {
        if (err) throw err;

        if (count > 0) return;

        var newCustomers = [
            {
                name: {
                    first: 'John',
                    last: 'Doe'
                },
                email: 'john@does.com',
                address: {
                    street: '123 No Way',
                    city: 'Bend',
                    state: 'OR',
                    country: 'US',
                    zip: 97702
                },
            },
            {
                name: {
                    first: 'Sam',
                    last: 'Iam'
                },
                email: 'samiam@drsuess.com',
                address: {
                    street: '321 Real St.',
                    city: 'Crazy',
                    state: 'CA',
                    country: 'US',
                    zip: 90025
                }
            }
        ];
        Customers.create(newCustomers, function(err, results) {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log(results);
            return;
        });
    });
}

module.exports = function() {
    seedSuppliers()
    .then(seedCustomers);
}