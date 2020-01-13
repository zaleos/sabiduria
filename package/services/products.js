const client = require('./in-memory-data');
const config = require('../config');
const htmlParser = require('../services/html-parser');
const logger = require('debug')('products');
const pathResolver = require('path');

exports.getProducts = function () {
    // Wait for the promise done.
    return client.getkeys().then(function (keys) {
        return keys.reverse();
    });
};

exports.getProductVersions = function (productId) {
    return client.get(productId).then(function (versions) {
        return versions;
    });
};

exports.getLastVersion = function (productId) {
    logger('Requested product: ' + productId);
    return client.getlast(productId).then(function (version) {
        logger('Last version: ' + version);
        return version;
    });
};

exports.getVersionStartingWith = function (productId, prefix) {
    return client.getStartingWith(productId, prefix).then(function (versions) {
        return versions;
    });
};

exports.getFilePath = function (productId, version, file, format) {
    if (format === 'html') {
        const filePath = config.productsFolder + '/' + productId + '/' + version + config.productSourcesRelativeFolder + '/' + format + '/' + file + '.' + format;
        return pathResolver.resolve(filePath);
    } else {
        throw 'Unknown format';
    }
};

exports.getDescription = function (path) {
    return htmlParser.getDescription(path).then(function (description) {
        return description;
    });
};

exports.add = function (product, version) {
    return client.add(product, version).then(function (result) {
        return result;
    });
};

exports.remove = function (product, version) {
    return client.remove(product, version).then(function (result) {
        return result;
    });
};

exports.getLogoPath = function (path) {
    return htmlParser.getLogoPath(path).then(function (logoPath) {
        return logoPath;
    });
};
