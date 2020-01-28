"use strict";

describe("Geoserver Coverage Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer, type;
    let coverageConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(() => {
        coverageConfig = { name: "AR_2014", store: "AR_2014", workspace: "geoportal" };
        geoserverConnector = new GeoserverConnector(config.unit_test);

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.isGeoserverRunning.name);
        geoserverConnector.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.initializeWorkspace.name);
        geoserverConnector.initializeWorkspace.returns(Promise.resolve());

        type = geoserverConnector.types.COVERAGE;
    });

    it("should check coverage existance ", async () => {
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverConnector.coverageExists(coverageConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, coverageConfig);
        expect(result).to.be.eql(true);
    });

    it("should get coverage ", async () => {
        const coverageStoreDetails = { coverage: coverageConfig };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(coverageStoreDetails));

        const result = await geoserverConnector.getCoverage(coverageConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, coverageConfig);
        expect(result).to.be.eql(coverageStoreDetails.coverage);
    });

    it("should update coverage ", async () => {
        const config = { name: coverageConfig.name, updatedConfig: { name: "new_name" } };
        geoserverConnector.coverageExists = sinon.stub().returns(Promise.resolve(true));
        geoserverConnector.issueCoverageUpdateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverConnector.updateCoverage(config);

        expect(geoserverConnector.issueCoverageUpdateRequest).to.have.been.calledWith(config);
    });

});
