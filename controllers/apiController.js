var Customers = require('../models/customerModel');
var Orders = require('../models/orderModel');
var Suppliers = require('../models/supplierModel');
var bodyParser = require('body-parser');
var _ = require('lodash');
var Q = require('q');
var request = require('superagent');
var config = require('../config');

function getCustomerByCID(customerId) {
    var deferred = Q.defer();

    Customers.findById({ _id: customerId }, function(err, customer) {
        if (err) {
            deferred.reject(err);
        }

        if (_.includes(config.getDisqualifiedCountries(), customer.address.country)) {
            deferred.reject({addressRejected: true});
        }

        deferred.resolve(customer);
    });

    return deferred.promise;
}

function getSupplier(make) {
    var deferred = Q.defer();

    Suppliers.findOne({name: make}, function(err, supplier) {
        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(supplier);
    });

    return deferred.promise;
}

function getRequestToken(requestData) {
    var deferred = Q.defer();

    request.get(requestData.tokenURL)
        .set('Accept', 'application/json')
        .query({ storefront: requestData.request_id })
        .then(function(err, res) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(res);
            }
        });

    return deferred.promise;
}

function placeOrder(orderData) {
    var deferred = Q.defer();

    orderData.supplierName === 'ACME' ?
        request.post(orderData.apiURL)
            .send('api_key=' + orderData.request_id)
            .send('model=' + orderData.model)
            .send('package=' + orderData.package)
            .then(function(err, res) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(res.order);
                }
            }) :
        getRequestToken({ tokenURL: orderData.tokenURL, request_id: orderData.request_id })
        .then(function(token) {
            request.post(orderData.apiURL)
                .send({ token: token.nonce_token, model: orderData.model, package: orderData.package })
                .then(function(err, res) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(res.order_id);
                    }
                })
        }, function(reason) {
            deferred.reject(reason);
        });

    return deferred.promise;
}

module.exports = function (app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.post('/order', function(req, res) {
        if (req.body.customer_id) {
            getCustomerByCID(req.body.customer_id)
            .then(function(customer) {
                getSupplier(req.body.make)
                .then(function(supplier) {
                    var orderData = {
                        apiURL: supplier.api_url,
                        tokenURL: supplier.token_url,
                        request_id: supplier.request_id,
                        model: req.body.model,
                        package: req.body.package,
                        supplierName: supplier.name
                    };

                    placeOrder(orderData)
                    .then(function(orderResponse) {
                        var newOrder = Orders({
                            make: req.body.make,
                            model: req.body.model,
                            package: req.body.package,
                            customer: customer,
                            supplier: supplier,
                            supplier_order_id: orderResponse
                        });
                        newOrder.save(function(err, order) {
                            if (err) {
                                res.status(500).json({ error: 'Failed to save order' });
                            } else {
                                res.json({ success: true, fileURL: config.baseURL('download/order/' + order._id) });
                            }
                        })
                    }, function(reason) {
                        res.status(500).json({ reason });
                    })

                }, function (reason) {
                    res.status(500).json({ reason });
                })
            }, function(reason) {
                if (reason.addressRejected) {
                    res.status(403).json({ error: 'Address not supported' });
                } else {
                    res.status(500).json({ reason });
                }
            })
        } else {
            res.status(400).send('Please include customer_id');
        }
    });

    app.get('/download/order/:id', function(req, res) {
        Orders.findById({ _id: req.params.id }, function(err, order) {
            if (err) {
                res.status(404).send('Not Found');
            } else {
                var json = JSON.stringify(order);
                var filename = 'order-' + order._id + '.json';
                res.set({
                    'Content-Type': 'application/json',
                    'Content-disposition': 'attachment; filename=' + filename
                });
                res.send(json);
            }
        });
    });
}