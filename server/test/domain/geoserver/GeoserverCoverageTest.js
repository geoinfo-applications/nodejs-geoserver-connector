"use strict";

describe("Geoserver Coverage Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    let geoserverRepository, geoserverMockServer, type;
    let coverageConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(() => {
        coverageConfig = { name: "AR_2014", store: "AR_2014", workspace: "geoportal" };
        geoserverRepository = new GeoserverRepository(config.unit_test);

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.isGeoserverRunning.name);
        geoserverRepository.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.initializeWorkspace.name);
        geoserverRepository.initializeWorkspace.returns(Promise.resolve());

        type = geoserverRepository.types.COVERAGE;
    });

    afterEach(() => {
        geoserverRepository = null;
    });

    it("should check coverage existance ", async () => {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverRepository.coverageExists(coverageConfig);

        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, coverageConfig);
        expect(result).to.be.eql(true);
    });

    it("should get coverage ", async () => {
        const coverageStoreDetails = { coverage: coverageConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(coverageStoreDetails));

        const result = await geoserverRepository.getCoverage(coverageConfig);

        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, coverageConfig);
        expect(result).to.be.eql(coverageStoreDetails.coverage);
    });

    it("should update coverage ", async () => {
        const config = { name: coverageConfig.name, updatedConfig: { name: "new_name" } };
        geoserverRepository.coverageExists = sinon.stub().returns(Promise.resolve(true));
        geoserverRepository.issueCoverageUpdateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverRepository.updateCoverage(config);

        expect(geoserverRepository.issueCoverageUpdateRequest).to.have.been.calledWith(config);
    });

});
