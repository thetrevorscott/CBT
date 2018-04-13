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

    Customers.findById({ _id: customerId }, function (err, customer) {
        if (err) {
            deferred.reject(err);
        }

        if (!customer) {
            deferred.reject('No customer found');
        } else if (_.includes(config.getDisqualifiedCountries(), customer.address.country)) {
            deferred.reject({ addressRejected: true });
        }

        deferred.resolve(customer);
    });

    return deferred.promise;
}

function getSupplier(make) {
    var deferred = Q.defer();

    Suppliers.findOne({ name: make }, function (err, supplier) {
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
        .on('error', function(err) {
            deferred.reject(err);
        })
        .then(function (res) {
            deferred.resolve(res.body);
        })
        .catch(function (err) {
            deferred.reject(err);
        });

    return deferred.promise;
}

function placeOrder(orderData) {
    var deferred = Q.defer();

    if (orderData.supplierName === 'ACME') {
        request.post(orderData.apiURL)
            .send('api_key=' + orderData.request_id)
            .send('model=' + orderData.model)
            .send('package=' + orderData.package)
            .on('error', function(err) {
                deferred.reject(err);
            })
            .then(function (res) {
                deferred.resolve(res.body.order);
            })
            .catch(function (err) {
                console.error('error happened', err);
                deferred.reject(err);
            });
    } else {
        getRequestToken({ tokenURL: orderData.tokenURL, request_id: orderData.request_id })
            .then(function (token) {
                request.post(orderData.apiURL)
                    .send({ token: token.nonce_token, model: orderData.model, package: orderData.package })
                    .on('error', function (err) {
                        deferred.reject(err);
                    })
                    .then(function (res) {
                        deferred.resolve(res.body.order_id);
                    })
                    .catch(function (err) {
                        console.error('error happened: ', err);
                    })
            }, function (reason) {
                deferred.reject(reason);
            })
            .catch(function(err) {
                deferred.reject(err);
            });
    }

    return deferred.promise;
}

module.exports = function (app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.post('/order', function (req, res) {
        var isDataValid = true;
        var missingValues = [];
        ['make', 'model', 'package', 'customer_id'].forEach(function(itm) {
            if (!req.body[itm]) {
                missingValues.push(itm);
                isDataValid = false;
            }
        });
        if (isDataValid) {
            getCustomerByCID(req.body.customer_id)
                .then(function (customer) {
                    getSupplier(req.body.make)
                        .then(function (supplier) {
                            var orderData = {
                                apiURL: supplier.api_url,
                                tokenURL: supplier.token_url,
                                request_id: supplier.request_id,
                                model: req.body.model,
                                package: req.body.package,
                                supplierName: supplier.name
                            };

                            placeOrder(orderData)
                                .then(function (orderResponse) {
                                    var newOrder = Orders({
                                        make: req.body.make,
                                        model: req.body.model,
                                        package: req.body.package,
                                        customer: customer,
                                        supplier: supplier,
                                        supplier_order_id: orderResponse
                                    });
                                    newOrder.save(function (err, order) {
                                        if (err) {
                                            res.status(500).json({ error: 'Failed to save order' });
                                        } else {
                                            res.json({ success: true, fileURL: config.baseURL('download/order/' + order._id) });
                                        }
                                    })
                                }, function (reason) {
                                    res.status(500).json({ reason });
                                })

                        }, function (reason) {
                            res.status(500).json({ reason });
                        })
                }, function (reason) {
                    if (reason.addressRejected) {
                        res.status(403).json({ error: 'Address not supported' });
                    } else {
                        res.status(500).json({ reason });
                    }
                })
                .catch(function (err) {
                    res.status(500).json({ error: err });
                });
        } else {
            res.status(400).send('Please include the following values: '+missingValues.join(', '));
        }
    });

    app.get('/download/order/:id', function (req, res) {
        Orders.findById({ _id: req.params.id }, function (err, order) {
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

    app.get('/orders', function (req, res) {
        var adminKey = process.env.ADMIN_KEY || '12345';
        if (req.get('admin-key') !== adminKey) {
            res.status(403).send('You must have admin privileges');
        } else {
            Orders.find({}, function (err, orders) {
                if (err) {
                    res.status(500).send('Uh oh, something went wrong');
                } else {
                    res.json(orders);
                }
            });
        }
    });
}