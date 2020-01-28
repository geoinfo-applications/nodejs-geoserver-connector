"use strict";

describe("Geoserver Coverage Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    const storeConfig = { name: "AR_2014", workspace: "geoportal" };

    beforeEach(() => {
        geoserverConnector = new GeoserverConnector(config.unit_test);

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.isGeoserverRunning.name);
        geoserverConnector.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.initializeWorkspace.name);
        geoserverConnector.initializeWorkspace.returns(Promise.resolve());
    });

    it("should check coverage store existance ", async () => {
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverConnector.coverageStoreExists();

        expect(result).to.be.eql(true);
    });

    it("should get coverage store ", async () => {
        const coverageStoreDetails = { coverageStore: {} };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(coverageStoreDetails));

        const result = await geoserverConnector.getCoverageStore();

        expect(result).to.be.eql(coverageStoreDetails.coverageStore);
    });

    it("should delete coverage store ", async () => {
        geoserverConnector.coverageStoreExists = sinon.stub().returns(Promise.resolve(true));
        geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        await geoserverConnector.deleteCoverageStore(storeConfig);

        expect(geoserverConnector.coverageStoreExists).to.have.been.calledWith({
            name: storeConfig.name,
            workspace: config.unit_test.geoserver.workspace
        });
    });

    it("should create coverage store ", async () => {
        const config = { name: storeConfig.name, coverageDirectory: "file:///absolute_path" };
        geoserverConnector.coverageStoreExists = sinon.stub().returns(Promise.resolve(false));
        geoserverConnector.issueCoverageStoreCreateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverConnector.createCoverageStore(config);

        expect(geoserverConnector.issueCoverageStoreCreateRequest).to.have.been.calledWith(config);
    });

    describe("testing coverage store create method ", () => {

        let type, config, url;

        beforeEach(() => {
            type = geoserverConnector.types.COVERAGESTORE;
            config = { name: storeConfig.name, coverageDirectory: "file:///absolute_path" };
            url = "valid_url";

            geoserverConnector.resolver.create = sinon.stub().returns(url);
            geoserverConnector.dispatcher.put = sinon.stub();
            geoserverConnector.createResponseListener = sinon.stub();
        });

        it("should isssue put method for coverage store create ", () => {
            geoserverConnector.issueCoverageStoreCreateRequest(config);

            // we are not wating for promise to fulfill here
            expect(geoserverConnector.resolver.create).to.have.been.calledWith(type, config);
            expect(geoserverConnector.dispatcher.put).to.have.been.calledWith();
            expect(geoserverConnector.createResponseListener).to.have.been.calledWith();
        });

        it("should add additional external.pyramid parameter to url request ", () => {
            geoserverConnector.issueCoverageStoreCreateRequest(config);

            const dispatcherArgs = geoserverConnector.dispatcher.put.firstCall.args[0];

            expect(dispatcherArgs.url).to.be.eql(url + "/external.imagepyramid");
        });

        it("should add additional external.mosaic parameter to url request ", () => {
            config.coverageStoreType = "imagemosaic";
            geoserverConnector.issueCoverageStoreCreateRequest(config);

            const dispatcherArgs = geoserverConnector.dispatcher.put.firstCall.args[0];

            expect(dispatcherArgs.url).to.be.eql(url + "/external." + config.coverageStoreType);
        });

    });


});
