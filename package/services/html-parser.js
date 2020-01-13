const jsdom = require("jsdom");
const {
    JSDOM,
} = jsdom;
const fs = require('fs');
const logger = require('debug')('parser');

/**
 * Returns the description html from documentation.
 * @param {String} path to html file.
 * @return {Promise} Desciption HTML.
 */
exports.getDescription = function (path) {
    logger('Parsing decription from ' + path);
    return new Promise(function (resolve) {
        fs.readFile(path, 'utf8', function read(err, data) {
            if (err) {
                resolve('');
                return;
            }
            const dom = new JSDOM(data);
            const div = dom.window.document.querySelector('div[id^=user-manual]').children;
            let result = '<div>';
            let include = false;

            for (let i = 0; i < div.length; i++) {
                if (div[i].children[0] && div[i].children[0].textContent === 'Description:') {
                    div[i].removeChild(div[i].childNodes[0]);
                    include = true;
                }
                if (div[i].children[0] && div[i].children[0].textContent === 'Version:') {
                    break;
                }
                if (include) {
                    result += div[i].outerHTML;
                }
            }

            result += '</div>';

            resolve(result);
        });
    });
};

/**
 * Returns the logo path from html from documentation.
 * @param {String} path to html file.
 * @return {Promise} Logo path.
 */
exports.getLogoPath = function (path) {
    logger('Parsing logo from ' + path);
    return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function read(err, data) {
            if (err) {
                reject(err);
                return;
            }
            const dom = new JSDOM(data);
            const div = dom.window.document.querySelector('div[id^=user-manual] img');
            resolve(div.getAttribute('src'));
        });
    });
};
