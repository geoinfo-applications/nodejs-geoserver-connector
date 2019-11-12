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

    var geoserverRepository, geoserverMockServer, type;
    var coverageConfig;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    beforeEach(function (done) {
        coverageConfig = { name: "AR_2014", store: "AR_2014", workspace: "geoportal" };
        geoserverRepository = new GeoserverRepository(config.unit_test);

        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());
        type = geoserverRepository.types.COVERAGE;

        geoserverRepository.initializeWorkspace().then(function () {
            done();
        }).catch(done);
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    it("should check coverage existance ", function (done) {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(true));
        geoserverRepository.coverageExists(coverageConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, coverageConfig);
            expect(result).to.be.eql(true);
            done();
        }).catch(done);
    });

    it("should get coverage ", function (done) {
        var coverageStoreDetails = { coverage: coverageConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(coverageStoreDetails));

        geoserverRepository.getCoverage(coverageConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, coverageConfig);
            expect(result).to.be.eql(coverageStoreDetails.coverage);
            done();
        }).catch(done);
    });

    it("should update coverage ", function (done) {
        var config = { name: coverageConfig.name, updatedConfig: { name: "new_name" } };
        geoserverRepository.coverageExists = sinon.stub().returns(new Q(true));
        geoserverRepository.issueCoverageUpdateRequest = sinon.stub().returns(new Q());

        geoserverRepository.updateCoverage(config).then(function () {
            expect(geoserverRepository.issueCoverageUpdateRequest).to.have.been.calledWith(config);
            done();
        }).catch(done);
    });

});
