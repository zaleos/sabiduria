const config = require('../config');
const pathResolver = require('path');
const productService = require('./products');
const fs = require('fs');
const {
    join,
} = require('path');

const debug = require('debug')('watcher:debug');
const error = require('debug')('watcher:error');
const warning = require('debug')('watcher:warning');

/**
 * Parses path to get product and version
 * @param {String} path
 * @return {Array} 2-sized array with product at first position and version at second.
 */
function getProductAndVersionFromPath(path) {
    const root = pathResolver.resolve(config.productsFolder);
    // Remove root
    const splitted = path.split(root);
    // product / version tuple
    const tuple = splitted[1].split('/');

    // path validation
    if (path.includes(root) && splitted.length > 1 && splitted[1] !== '' && tuple.length >= 3) {
        return [tuple[1], tuple[2]];
    }
    return null;
}

/**
 * Process path to search for all three product documentation files and add it.
 * @param {String} path 
 */
function processPath(path) {
    if (path.includes(config.productSourcesRelativeFolder + '/html/index.html')) {
        const tuple = getProductAndVersionFromPath(path);

        if (!tuple) {
            error(`Error getting product and version`);
            return;
        }

        // Check if HTML documentation has been added successfully.
        fs.access(config.productsFolder + tuple[0] + '/' + tuple[1] + config.productSourcesRelativeFolder + '/html/index.html', (err) => {
            if (!err) {
                productService.add(tuple[0], tuple[1]).then(function (result) {
                    if (result === true) {
                        debug(`Product ${tuple[0]}, version ${tuple[1]}, has been added.`);
                    }
                });
            } else {
                warning(`${config.productsFolder}${tuple[0]}/${tuple[1] + config.productSourcesRelativeFolder}/html/index.html doesn't exist.`);
            }
        });
    }
}

/**
 * Traverse product folder to find new products/versions documentation.
 */
function watchProductFolder() {
    fs.readdir(config.productsFolder, function (err, products) {
        if (err) {
            error(`Worker error: ${err}`);
            return;
        }
        products.forEach(function (product) {
            fs.readdir(join(config.productsFolder, product), function (err, versions) {
                if (err) {
                    error(`Worker error: ${err}`);
                    return;
                }
                versions.forEach(function (version) {
                    const file = join(config.productsFolder, product, version, config.productSourcesRelativeFolder, '/html/index.html');
                    processPath(file);
                });
            });
        });
    });
}

/**
 * Traverse products stored to check whether still exist in file system.
 */
function watchProductsStored() {
    productService.getProducts().then(function (products) {
        products.forEach(function (product) {
            productService.getProductVersions(product).then(function (versions) {
                versions.forEach(function (version) {
                    fs.access(config.productsFolder + product + '/' + version + config.productSourcesRelativeFolder + '/html/index.html', (err) => {
                        if (err) {
                            productService.remove(product, version).then(function (result) {
                                if (result) {
                                    debug(`Product ${product}, version ${version} has been removed`);
                                }
                            });
                        }
                    });
                });
            });
        });
    });
}

/**
 * Start worker.
 */
function start() {
    watchProductFolder();
    watchProductsStored();
}

setInterval(start, process.env.WORKER_PERIOD || 5000);
