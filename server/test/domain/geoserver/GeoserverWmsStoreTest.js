"use strict";

describe("Geoserver Wms Store Test ", function () {

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
    var wmsStoreConfig;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    beforeEach(function (done) {
        wmsStoreConfig = {
            name: "ch",
            label: "CH",
            url: "http://wms.geo.admin.ch",
            username: null,
            password: null
        };

        geoserverRepository = new GeoserverRepository(config.unit_test);

        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());
        type = geoserverRepository.types.WMSSTORE;

        geoserverRepository.initializeWorkspace().then(function () {
            done();
        }).catch(done);
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    it("should check wms store existance", function (done) {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(true));
        geoserverRepository.wmsStoreExists(wmsStoreConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmsStoreConfig);
            expect(result).to.be.eql(true);
            done();
        }).catch(done);
    });

    it("should get wms store", function (done) {
        var wmsStoreDetails = { wmsStore: wmsStoreConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(wmsStoreDetails));
        var getWmsStoreConfig =  { name: "ch", workspace: "geoportal" };

        geoserverRepository.getWmsStore(wmsStoreConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, {
                name: getWmsStoreConfig.name,
                workspace: getWmsStoreConfig.workspace
            });
            expect(result).to.be.eql(wmsStoreDetails.wmsStore);
            done();
        }).catch(done);
    });

    it("should create wms store", function (done) {
        geoserverRepository.wmsStoreExists = sinon.stub().returns(new Q(false));
        geoserverRepository.issueWmsStoreCreateRequest = sinon.stub().returns(new Q());

        geoserverRepository.createWmsStore(wmsStoreConfig).then(function () {
            expect(geoserverRepository.issueWmsStoreCreateRequest).to.have.been.calledWith(wmsStoreConfig);
            done();
        }).catch(done);
    });

    it("should delete wms store", function (done) {
        geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q(true));

        geoserverRepository.deleteWmsStore(wmsStoreConfig).then(function () {
            expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(type, wmsStoreConfig);
            done();
        }).catch(done);
    });

    it("should return wms store request object", function (done) {
        var requestObject = geoserverRepository.wmsStoreRequestObject(wmsStoreConfig);
        expect(requestObject).to.be.eql({
            wmsStore: {
                name: wmsStoreConfig.name,
                description: wmsStoreConfig.label,
                type: "WMS",
                enabled: true,
                workspace: { name: wmsStoreConfig.workspace ? wmsStoreConfig.workspace :
                    geoserverRepository.geoserver.workspace },
                capabilitiesURL: wmsStoreConfig.url,
                user: wmsStoreConfig.username,
                password: wmsStoreConfig.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        });
        done();

    });

});
