"use strict";

describe("Geoserver Coverage Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    let geoserverRepository, geoserverMockServer;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    const storeConfig = { name: "AR_2014", workspace: "geoportal" };

    beforeEach(() => {
        geoserverRepository = new GeoserverRepository(config.unit_test);

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.isGeoserverRunning.name);
        geoserverRepository.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.initializeWorkspace.name);
        geoserverRepository.initializeWorkspace.returns(Promise.resolve());
    });

    afterEach(() => {
        geoserverRepository = null;
    });

    it("should check coverage store existance ", async () => {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverRepository.coverageStoreExists();

        expect(result).to.be.eql(true);
    });

    it("should get coverage store ", async () => {
        const coverageStoreDetails = { coverageStore: {} };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(coverageStoreDetails));

        const result = await geoserverRepository.getCoverageStore();

        expect(result).to.be.eql(coverageStoreDetails.coverageStore);
    });

    it("should delete coverage store ", async () => {
        geoserverRepository.coverageStoreExists = sinon.stub().returns(Promise.resolve(true));
        geoserverRepository.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        await geoserverRepository.deleteCoverageStore(storeConfig);

        expect(geoserverRepository.coverageStoreExists).to.have.been.calledWith({
            name: storeConfig.name,
            workspace: config.unit_test.geoserver.workspace
        });
    });

    it("should create coverage store ", async () => {
        const config = { name: storeConfig.name, coverageDirectory: "file:///absolute_path" };
        geoserverRepository.coverageStoreExists = sinon.stub().returns(Promise.resolve(false));
        geoserverRepository.issueCoverageStoreCreateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverRepository.createCoverageStore(config);

        expect(geoserverRepository.issueCoverageStoreCreateRequest).to.have.been.calledWith(config);
    });

    describe("testing coverage store create method ", () => {

        let type, config, url;

        beforeEach(() => {
            type = geoserverRepository.types.COVERAGESTORE;
            config = { name: storeConfig.name, coverageDirectory: "file:///absolute_path" };
            url = "valid_url";

            geoserverRepository.resolver.create = sinon.stub().returns(url);
            geoserverRepository.dispatcher.put = sinon.stub();
            geoserverRepository.createResponseListener = sinon.stub();
        });

        it("should isssue put method for coverage store create ", () => {
            geoserverRepository.issueCoverageStoreCreateRequest(config);

            // we are not wating for promise to fulfill here
            expect(geoserverRepository.resolver.create).to.have.been.calledWith(type, config);
            expect(geoserverRepository.dispatcher.put).to.have.been.calledWith();
            expect(geoserverRepository.createResponseListener).to.have.been.calledWith();
        });

        it("should add additional external.pyramid parameter to url request ", () => {
            geoserverRepository.issueCoverageStoreCreateRequest(config);

            const dispatcherArgs = geoserverRepository.dispatcher.put.firstCall.args[0];

            expect(dispatcherArgs.url).to.be.eql(url + "/external.imagepyramid");
        });

        it("should add additional external.mosaic parameter to url request ", () => {
            config.coverageStoreType = "imagemosaic";
            geoserverRepository.issueCoverageStoreCreateRequest(config);

            const dispatcherArgs = geoserverRepository.dispatcher.put.firstCall.args[0];

            expect(dispatcherArgs.url).to.be.eql(url + "/external." + config.coverageStoreType);
        });

    });


});
