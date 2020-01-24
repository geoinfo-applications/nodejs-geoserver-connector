"use strict";

describe("Geoserver Wmts Store Test ", function () {

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
    var wmtsStoreConfig;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    beforeEach(function (done) {
        wmtsStoreConfig = {
            name: "ch",
            label: "CH",
            url: "http://wmts.geo.admin.ch",
            username: null,
            password: null
        };

        geoserverRepository = new GeoserverRepository(config.unit_test);

        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());
        type = geoserverRepository.types.WMTSSTORE;

        geoserverRepository.initializeWorkspace().then(function () {
            done();
        }).catch(done);
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    it("should check wmts store existance", function (done) {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(true));
        geoserverRepository.wmtsStoreExists(wmtsStoreConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmtsStoreConfig);
            expect(result).to.be.eql(true);
            done();
        }).catch(done);
    });

    it("should get wmts store", function (done) {
        var wmtsStoreDetails = { wmtsStore: wmtsStoreConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(wmtsStoreDetails));
        var getWmtsStoreConfig =  { name: "ch", workspace: "geoportal" };

        geoserverRepository.getWmtsStore(wmtsStoreConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, {
                name: getWmtsStoreConfig.name,
                workspace: getWmtsStoreConfig.workspace
            });
            expect(result).to.be.eql(wmtsStoreDetails.wmtsStore);
            done();
        }).catch(done);
    });

    it("should create wmts store", function (done) {
        geoserverRepository.wmtsStoreExists = sinon.stub().returns(new Q(false));
        geoserverRepository.issueWmtsStoreCreateRequest = sinon.stub().returns(new Q());

        geoserverRepository.createWmtsStore(wmtsStoreConfig).then(function () {
            expect(geoserverRepository.issueWmtsStoreCreateRequest).to.have.been.calledWith(wmtsStoreConfig);
            done();
        }).catch(done);
    });

    it("should delete wmts store", function (done) {
        geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q(true));

        geoserverRepository.deleteWmtsStore(wmtsStoreConfig).then(function () {
            expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(type, wmtsStoreConfig);
            done();
        }).catch(done);
    });

    it("should return wmts store request object", function (done) {
        var requestObject = geoserverRepository.wmtsStoreRequestObject(wmtsStoreConfig);
        expect(requestObject).to.be.eql({
            wmtsStore: {
                name: wmtsStoreConfig.name,
                description: wmtsStoreConfig.label,
                type: "WMTS",
                enabled: true,
                workspace: { name: wmtsStoreConfig.workspace ? wmtsStoreConfig.workspace :
                    geoserverRepository.geoserver.workspace },
                capabilitiesURL: wmtsStoreConfig.url,
                user: wmtsStoreConfig.username,
                password: wmtsStoreConfig.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        });
        done();

    });

});
