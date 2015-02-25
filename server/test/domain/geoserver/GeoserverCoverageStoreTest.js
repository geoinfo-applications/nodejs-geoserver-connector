"use strict";

describe("Geoserver Coverage Test ", function () {

    var Q = require("q");
    var chai = require("chai");
    var expect = chai.expect;
    var sinon = require("sinon");
    var sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    this.timeout(50);
    var config = require("../../config");
    var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    var geoserverRepository, geoserverMockServer;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    var storeConfig = { name: "AR_2014" };

    beforeEach(function () {
        geoserverRepository = new GeoserverRepository(config.unit_test);
        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    it("should check coverage store existance ", function (done) {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(true));

        geoserverRepository.coverageStoreExists().then(function (result) {
            expect(result).to.be.eql(true);
            done();
        }).catch(done);
    });

    it("should get coverage store ", function (done) {
        var coverageStoreDetails = { coverageStore: {} };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(coverageStoreDetails));

        geoserverRepository.getCoverageStore().then(function (result) {
            expect(result).to.be.eql(coverageStoreDetails.coverageStore);
            done();
        }).catch(done);
    });

    it("should delete coverage store ", function (done) {
        geoserverRepository.coverageStoreExists = sinon.stub().returns(new Q(true));
        geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q(true));

        geoserverRepository.deleteCoverageStore(storeConfig).then(function () {
            expect(geoserverRepository.coverageStoreExists).to.have.been.calledWith(
                { name: storeConfig.name, workspace: config.unit_test.geoserver.workspace }
            );
            done();
        }).catch(done);
    });

    it("should create coverage store ", function (done) {
        var config = { name: storeConfig.name, coverageDirectory: "file:///absolute_path" };
        geoserverRepository.coverageStoreExists = sinon.stub().returns(new Q(false));
        geoserverRepository.issueCoverageStoreCreateRequest = sinon.stub().returns(new Q());

        geoserverRepository.createCoverageStore(config).then(function () {
            expect(geoserverRepository.issueCoverageStoreCreateRequest).to.have.been.calledWith(config);
            done();
        }).catch(done);
    });

    describe("testing non standard geoserver create method ", function () {

        var type, config, url;

        beforeEach(function () {
            type = geoserverRepository.types.COVERAGESTORE;
            config = { name: storeConfig.name, coverageDirectory: "file:///absolute_path" };
            url = "valid_url";

            geoserverRepository.resolver.create = sinon.stub().returns(url);
            geoserverRepository.dispatcher.put = sinon.stub();
            geoserverRepository.createResponseListener = sinon.stub();
        });

        it("should isssue put method for coverage store create ", function (done) {
            geoserverRepository.issueCoverageStoreCreateRequest(config);

            // we are not wating for promise to fulfill here
            expect(geoserverRepository.resolver.create).to.have.been.calledWith(type, config);
            expect(geoserverRepository.dispatcher.put).to.have.been.calledWith();
            expect(geoserverRepository.createResponseListener).to.have.been.calledWith();
            done();
        });

        it("should add additional external.pyramid parameter to url request ", function (done) {
            geoserverRepository.issueCoverageStoreCreateRequest(type, config);

            var dispatcherArgs = geoserverRepository.dispatcher.put.firstCall.args[0];

            expect(dispatcherArgs.url).to.be.eql(url + "/external.imagepyramid");
            done();
        });

        it("should add additional external.mosaic parameter to url request ", function (done) {
            config.coverageStoreType = "imagemosaic";
            geoserverRepository.issueCoverageStoreCreateRequest(config);

            var dispatcherArgs = geoserverRepository.dispatcher.put.firstCall.args[0];

            expect(dispatcherArgs.url).to.be.eql(url + "/external." + config.coverageStoreType);
            done();
        });

    });


});
