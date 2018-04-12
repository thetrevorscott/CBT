var configValues = require('./config');

module.exports = {
    getDisqualifiedCountries: function() {
        return configValues.dqAddressCountries;
    },

    baseURL: function(path) {
        path = (path || "").replace(/^\//, '');
        return configValues.BASE_URL + "/" + path;
    }
}