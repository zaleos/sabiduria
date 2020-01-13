const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const app = require('../app');
const productsService = require('../services/products');
const sinon = require('sinon');
const expect = require('chai').expect;
const client = require('../services/in-memory-data');
const config = require('../config');
const chaiHttp = require('chai-http');

chai.use(chaiAsPromised).should();
chai.use(chaiHttp);

describe('Products service tests.', function () {
    it('Should return array with all products', function (done) {
        const stub = sinon.stub(client, 'getkeys');
        stub.resolves(['productA', 'productB']);

        const result = productsService.getProducts();

        expect(result).to.eventually.be.an('array').that.include('productA').and.include('productB').notify(done);

        stub.restore();
    });

    it('Should return empty array if no product', function (done) {
        const stub = sinon.stub(client, 'getkeys');
        stub.resolves([]);

        const result = productsService.getProducts();

        expect(result).to.eventually.be.an('array').that.is.empty.notify(done);

        stub.restore();
    });

    it('Should return array of product versions', function (done) {
        const productId = 'productA';

        const stub = sinon.stub(client, 'get');
        stub.withArgs(productId).resolves(['1.1', '1.2']);

        const result = productsService.getProductVersions(productId);

        expect(result).to.eventually.be.an('array').that.include('1.1').and.include('1.2').notify(done);

        stub.restore();
    });

    it('Should throw exception when product does not exist', function (done) {
        const productId = 'NonExistingProduct';

        const stub = sinon.stub(client, 'get');
        stub.withArgs(productId).rejects();

        const result = productsService.getProductVersions(productId);

        result.should.be.rejected.notify(done);

        stub.restore();
    });

    it('Should return product last version', function (done) {
        const productId = 'productA';

        const stub = sinon.stub(client, 'getlast');
        stub.withArgs(productId).resolves('1.2');

        const result = productsService.getLastVersion(productId);

        expect(result).to.eventually.equal('1.2').notify(done);

        stub.restore();
    });

    it('Should return undefined for non existing product last version', function (done) {
        const productId = 'productA';

        const result = productsService.getLastVersion(productId);

        expect(result).to.eventually.undefined.notify(done);
    });

    it('Should return array of product versions starting with prefix', function (done) {
        const productId = 'productA';
        const prefix = '1';

        const stub = sinon.stub(client, 'getStartingWith');
        stub.withArgs(productId, prefix).resolves(['1.1', '1.2']);

        const result = productsService.getVersionStartingWith(productId, prefix);

        expect(result).to.eventually.be.an('array').that.include('1.1').and.include('1.2').notify(done);

        stub.restore();
    });

    it('Should return well formed file path', function (done) {
        const productId = 'productA';
        const version = '0.1';

        expect(productsService.getFilePath(productId, version, 'index', 'html')).to.equal(config.productsFolder + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html');

        expect(() => productsService.getFilePath(productId, version, 'some_format')).to.throw();

        done();
    });

    it('Should create new product with version and return 1', function (done) {
        const product = 'productA';
        const version = '0.1';

        const stub = sinon.stub(client, 'add');
        stub.withArgs(product, version).resolves(1);

        const result = productsService.add(product, version);

        expect(result).to.eventually.equal(1).notify(done);

        stub.restore();
    });

    it('Should remove product version and return 1', function (done) {
        const product = 'productA';
        const version = '0.1';

        const stub = sinon.stub(client, 'remove');
        stub.withArgs(product, version).resolves(1);

        const result = productsService.remove(product, version);

        expect(result).to.eventually.equal(1).notify(done);

        stub.restore();
    });
});

describe('Data service tests.', function () {
    beforeEach(function () {
        client.clear();
    });

    it('Should return value', function (done) {
        const productId = 'productA';
        const version = '0.1';

        client.add(productId, version);
        expect(client.get(productId)).to.eventually.be.an('array').that.include(version).notify(done);
    });

    it('Should return all keys', function (done) {
        const products = ['productA', 'productB'];
        const version = '0.1';

        products.forEach(function (product) {
            client.add(product, version);
        });

        expect(client.getkeys()).to.eventually.be.an('array').that.include(products[0]).and.include(products[1]).notify(done);
    });

    it('Should return greatest key', function (done) {
        const product = 'productA';
        const versions = ['0.1', '0.3', '0.2'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        expect(client.getlast(product)).to.eventually.equal('0.3').notify(done);
    });

    // this should be green at main branch
    it('Should return greatest key 2', function (done) {
        const product = 'productA';
        const versions = ['0.1', '0.14', '0.2'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        expect(client.getlast(product)).to.eventually.equal('0.14').notify(done);
    });

    it('Should return array with all values starting with prefix', function (done) {
        const product = 'productA';
        const prefix = '0.1';
        const versions = ['0.1', '0.14', '0.2'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        expect(client.getStartingWith(product, prefix)).to.eventually.be.an('array').that.include('0.1').and.include('0.14').and.not.include('0.2').notify(done);
    });

    it('Should remove value', function (done) {
        const product = 'productA';
        const versions = ['0.1', '0.3', '0.2'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        const result = client.remove(product, versions[1]);

        expect(result).be.eventually.equal(true);
        expect(client.get(product)).to.eventually.be.an('array').that.include(versions[0]).and.include(versions[2]).and.not.include(versions[1]).notify(done);
    });

    it('Should remove key', function (done) {
        const product = 'productA';
        const version = '0.1';

        client.add(product, version);

        const result = client.remove(product, version);

        expect(result).be.eventually.equal(true);
        expect(client.getkeys()).to.eventually.be.an('array').that.not.include(product).notify(done);
    });
});

describe('Integration tests.', function () {
    beforeEach(function () {
        client.clear();
    });

    it('Should return array with all products', function (done) {
        const productsList = ['productA', 'productB'];
        const version = '0.1';

        productsList.forEach(function (product) {
            client.add(product, version);
        });

        const result = productsService.getProducts();
        expect(result).to.eventually.be.an('array').that.include('productA').and.include('productB').notify(done);
    });

    it('Should return empty array if no product', function (done) {
        const result = productsService.getProducts();
        expect(result).to.eventually.be.an('array').that.is.empty.notify(done);
    });

    it('Should return array of product versions', function (done) {
        const product = 'productA';
        const versions = ['1.1', '1.2'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        const productId = 'productA';
        const result = productsService.getProductVersions(productId);
        expect(result).to.eventually.be.an('array').that.include('1.1').and.include('1.2').notify(done);
    });

    it('Should throw exception when product does not exist', function (done) {
        const productId = 'productA';

        const result = productsService.getProductVersions(productId);

        result.should.be.rejected.notify(done);
    });

    it('Should return product last version', function (done) {
        const product = 'productA';
        const versions = ['1.1', '1.2'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        const result = productsService.getLastVersion(product);

        expect(result).to.eventually.equal('1.2').notify(done);
    });

    it('Should return array of product versions starting with prefix', function (done) {
        const product = 'productA';
        const versions = ['1.1', '1.2', '2.3'];

        versions.forEach(function (version) {
            client.add(product, version);
        });

        const prefix = '1';

        const result = productsService.getVersionStartingWith(product, prefix);

        expect(result).to.eventually.be.an('array').that.include('1.1').and.include('1.2').and.not.include('2.3').notify(done);
    });
});

describe('Routes tests.', function () {
    const productId = 'productA';
    const version = '0.1';

    before(function () {
        client.clear();
        client.add(productId, version);
    });

    it('Should request home and return 200', function (done) {
        chai.request(app)
            .get('/')
            .then(function (res) {
                expect(res).to.be.html;
                expect(res).to.have.header('content-type', 'text/html; charset=utf-8');
                expect(res).to.have.status(200);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('Should request product and return 200', function (done) {
        const stub = sinon.stub(productsService, 'getDescription');
        stub.withArgs(config.productsFolder + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html').resolves('some_description');

        chai.request(app)
            .get('/' + productId)
            .then(function (res) {
                expect(res).to.be.html;
                expect(res).to.have.header('content-type', 'text/html; charset=utf-8');
                expect(res).to.have.status(200);
                done();
            })
            .catch(function (err) {
                done(err);
            });

        stub.restore();
    });

    it('Should request /<product_name>/<version> and redirect to html documentation', function (done) {
        chai.request(app)
            .get('/' + productId + '/' + version)
            .redirects(0)
            .then(function (res) {
                expect(res).to.have.status(302);
                expect(res).to.have.header('Location', '/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html');
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('Should request /<product_name>/<version>/user and redirect to html documentation', function (done) {
        chai.request(app)
            .get('/' + productId + '/' + version + '/user')
            .redirects(0)
            .then(function (res) {
                expect(res).to.have.status(302);
                expect(res).to.have.header('Location', '/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html');
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('Should request /<product_name>/<version>/user/en and redirect to html documentation', function (done) {
        chai.request(app)
            .get('/' + productId + '/' + version + config.productSourcesRelativeFolder)
            .redirects(0)
            .then(function (res) {
                expect(res).to.have.status(302);
                expect(res).to.have.header('Location', '/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html');
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('Should request /<product_name>/<version>/user/en/html and redirect to html documentation', function (done) {
        chai.request(app)
            .get('/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html')
            .redirects(0)
            .then(function (res) {
                expect(res).to.have.status(302);
                expect(res).to.have.header('Location', '/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html');
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('Should request /<product_name>/<version>/user/en/html/index.html and return 404', function (done) {
        chai.request(app)
            .get('/' + productId + '/' + version + config.productSourcesRelativeFolder + '/html/index.html')
            .then(function (res) {
                expect(res).to.be.html;
                expect(res).to.have.header('content-type', 'text/html; charset=utf-8');
                expect(res).to.have.status(404);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });

    it('Should request /<product_name> return 404 when does not exists', function (done) {
        chai.request(app)
            .get('/noexisting')
            .then(function (res) {
                expect(res).to.be.html;
                expect(res).to.have.header('content-type', 'text/html; charset=utf-8');
                expect(res).to.have.status(404);
                done();
            })
            .catch(function (err) {
                done(err);
            });
    });
});
