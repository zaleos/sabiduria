const express = require('express');
const productsService = require('../services/products');
const config = require('../config');
const pathResolver = require('path');
const createError = require('http-errors');
const logger = require('debug')('index');

const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	const rowSize = req.query['rowsize'] ? req.query['rowsize'] : 4;

	productsService.getProducts().then(function (products) {
		res.render('index', {
			title: 'Sabiduria',
			products: products,
			docFolder: config.productSourcesRelativeFolder,
			rowSize: rowSize,
		});
	});
});

/* GET product versions listing. */
router.get('/:productId', function (req, res, next) {
	const productId = req.params['productId'];

	if (productId === 'favicon.ico') {
		next();
		return;
	}

	productsService.getLastVersion(productId).then(function (last) {
		if (typeof last == 'undefined') {
			next(createError(404, 'The requested URL ' + req.path + ' was not found on this server.'));
			return;
		}

		let filePath = config.productsFolder + productId + '/' + last + config.productSourcesRelativeFolder + '/html/index.html';
		let resolvedPath = pathResolver.resolve(filePath);
		productsService.getDescription(resolvedPath).then(function (description) {
			res.render('product', {
				productId: productId,
				docFolder: config.productSourcesRelativeFolder,
				description: description,
			});
		});
	});
});

/**
 * Get product documentation latest version.
 */
router.get('/:productId/latest/user/en/:format(html)/:file.:format(html)', function (req, res, next) {
	const productId = req.params['productId'];
	const format = req.params['format'];
	const file = req.params['file'];

	productsService.getLastVersion(productId).then(function (latestVersion) {
		const resolvedPath = productsService.getFilePath(productId, latestVersion, file, format);

		res.sendFile(resolvedPath, function (err) {
			if (err) {
				next(createError(404, 'The requested URL ' + req.path + ' was not found on this server.'));
			}
		});
	});
});

/**
 * Get products documentation.
 */
router.get('/:productId/:version/user/en/:format(html)/:file.:format(html)', function (req, res, next) {
	const productId = req.params['productId'];
	const version = req.params['version'];
	const format = req.params['format'];
	const file = req.params['file'];
	const resolvedPath = productsService.getFilePath(productId, version, file, format);

	res.sendFile(resolvedPath, function (err) {
		if (err) {
			next(createError(404, 'The requested URL ' + req.path + ' was not found on this server.'));
		}
	});
});

// Return the result of filtering.
router.get('/:productId/search', function (req, res) {
	const productId = req.params['productId'];

	productsService.getVersionStartingWith(productId, req.query.key).then(function (versions) {
		productsService.getLastVersion(productId).then(function (lastVersion) {
			result = {};
			result.lastVersion = lastVersion;
			result.versions = versions;
			res.end(JSON.stringify(result));
		});
	});
});

router.get('/:productId/logo', function (req, res, next) {
	const productId = req.params['productId'];

	productsService.getLastVersion(productId).then(function (last) {
		let filePath = config.productsFolder + '/' + productId + '/' + last + '/' + config.productSourcesRelativeFolder + '/html/index.html';
		let resolvedPath = pathResolver.resolve(filePath);

		productsService.getLogoPath(resolvedPath).then(function name(logoPath) {
			resolvedPath = pathResolver.resolve(config.productsFolder + '/' + productId + '/' + last + '/' + config.productSourcesRelativeFolder + '/html/' + logoPath);
			res.sendFile(resolvedPath);
		}).catch(() => {
				next(createError(404, 'The requested URL ' + req.path + ' was not found on this server.'));
			});
	});
});

/**
 * Solve product html static files.
 */
router.get('/:productId/:version/user/en/html/*', function (req, res, next) {
	const productId = req.params['productId'];
	const version = req.params['version'];

	logger('Requested path: ' + req.path);

	if (version === 'latest') {
		productsService.getLastVersion(productId).then(function (version) {
			logger('Last version: ' + version);
			const resolvedPath = pathResolver.resolve(config.productsFolder + '/' + req.path.replace('latest', version));
			res.sendFile(resolvedPath);
		});
	} else {
		const resolvedPath = pathResolver.resolve(config.productsFolder + '/' + req.path);
		res.sendFile(resolvedPath);
	}
});

router.get('/:productId/:version*', function (req, res, next) {
	const productId = req.params['productId'];
	const version = req.params['version'];
	res.redirect('/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html');
});

module.exports = router;
