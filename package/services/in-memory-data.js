/**
 * Module for in-memory data structure to store products and versions. Using http://www.collectionsjs.com.
 */
const SortedArrayMap = require("collections/sorted-array-map");
const SortedArraySet = require("collections/sorted-array-set");
const logger = require('debug')('data');

const products = new SortedArrayMap();

/**
 * Comparator of product versions.
 * @param {String} left
 * @param {String} right
 * @return {Integer} -1 if left lower than right, 1 if left is greater that right, zero otherwise.
 */
function versionComparator(left, right) {
    const leftSplitted = left.split('.');
    const rightSplitted = right.split('.');

    for (let i = 0; i < leftSplitted.length && i < rightSplitted.length; i++) {
        if (parseInt(leftSplitted[i]) < parseInt(rightSplitted[i])) {
            return -1;
        }

        if (parseInt(leftSplitted[i]) > parseInt(rightSplitted[i])) {
            return 1;
        }
    }

    // if an operand has less members, all of them equal to the other correspondents, it will be considered lower
    if (leftSplitted.length < rightSplitted.length) {
        return -1;
    }

    if (leftSplitted.length > rightSplitted.length) {
        return 1;
    }

    return 0;
    /* const leftFirstDot = left.indexOf('.');
    const leftCurrent = leftFirstDot >= 0? left.substring(0, leftFirstDot): left;
    const leftRest = leftFirstDot >= 0? left.substring(leftFirstDot + 1, left.length): null;

    const rightFirstDot = right.indexOf('.');
    const rightCurrent = rightFirstDot >= 0? right.substring(0, rightFirstDot): right;
    const rightRest = rightFirstDot>=0? right.substring(rightFirstDot + 1, right.length): null;

    if (parseInt(leftCurrent) < parseInt(rightCurrent)) {
        return -1;
    }

    if (parseInt(leftCurrent) > parseInt(rightCurrent)) {
        return 1;
    }

    if (leftRest && rightRest) {
        return versionComparator(leftRest, rightRest);
    }

    if (!leftRest && rightRest) {
        return -1;
    }

    if (rightRest && !rightRest) {
        return 1;
    }

    return 0; */
}

exports.add = function (key, value) {
    logger('Adding product: ' + key + ', version: ' + value);
    return new Promise(function (resolve) {
        let result = false;

        if (!products.has(key)) {
            const values = new SortedArraySet();
            // overwrite comparator
            values.contentCompare = versionComparator;
            result = values.add(value);
            products.set(key, values);
            logger('Adding product: ' + key + ', version: ' + value + ', result: ' + result);
        } else {
            result = products.get(key).add(value);
            logger('Adding product: ' + key + ', version: ' + value + ', result: ' + result);
        }

        resolve(result);
    });
};

exports.get = function (key) {
    return new Promise(function (resolve) {
        const result = products.get(key);

        if (result) {
            resolve(Array.from(result));
        } else {
            throw 'Key not found';
        }
    });
};

exports.getlast = function (key) {
    logger('Product last version: ' + key);
    return new Promise(function (resolve) {
        if (products.get(key)) {
            const result = products.get(key).max();
            logger('Product ' + key + ' last version: ' + result);
            resolve(result);
        } else {
            logger('Product ' + key + ' last version not found');
            resolve();
        }
    });
};

exports.remove = function (key, value) {
    return new Promise(function (resolve) {
        try {
            let result = products.get(key).delete(value);

            if (products.get(key).length === 0) {
                result = result && products.delete(key);
            }

            resolve(result);
        } catch (err) {
            // key was already deleted
            resolve(true);
        }
    });
};

exports.getkeys = function () {
    return new Promise(function (resolve) {
        const result = Array.from(products.keys());
        resolve(result);
    });
};

exports.getStartingWith = function (key, prefix) {
    return new Promise(function (resolve) {
        const result = products.get(key).filter((i) => i.startsWith(prefix));
        resolve(Array.from(result).reverse());
    });
};

exports.clear = function () {
    products.clear();
};