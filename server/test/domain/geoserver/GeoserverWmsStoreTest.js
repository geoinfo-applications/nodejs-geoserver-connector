"use strict";

describe("Geoserver Wms Store Test ", () => {

    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    let geoserverRepository, geoserverMockServer, type;
    let wmsStoreConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(async () => {
        wmsStoreConfig = {
            name: "ch",
            label: "CH",
            url: "http://wms.geo.admin.ch",
            username: null,
            password: null
        };

        geoserverRepository = new GeoserverRepository(config.unit_test);

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.isGeoserverRunning.name);
        geoserverRepository.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.initializeWorkspace.name);
        geoserverRepository.initializeWorkspace.returns(Promise.resolve());

        type = geoserverRepository.types.WMSSTORE;
        await geoserverRepository.initializeWorkspace();
    });

    afterEach(() => {
        geoserverRepository = null;
    });

    it("should check wms store existance", async () => {
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverRepository.wmsStoreExists(wmsStoreConfig);

        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmsStoreConfig);
        expect(result).to.be.eql(true);
    });

    it("should get wms store", async () => {
        const wmsStoreDetails = { wmsStore: wmsStoreConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmsStoreDetails));
        const getWmsStoreConfig = { name: "ch", workspace: "geoportal" };

        const result = await geoserverRepository.getWmsStore(wmsStoreConfig);

        expect(result).to.be.eql(wmsStoreDetails.wmsStore);
        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, {
            name: getWmsStoreConfig.name,
            workspace: getWmsStoreConfig.workspace
        });
    });

    it("should create wms store", async () => {
        geoserverRepository.wmsStoreExists = sinon.stub().returns(Promise.resolve(false));
        geoserverRepository.issueWmsStoreCreateRequest = sinon.stub().returns(Promise.resolve());

        await geoserverRepository.createWmsStore(wmsStoreConfig);

        expect(geoserverRepository.issueWmsStoreCreateRequest).to.have.been.calledWith(wmsStoreConfig);
    });

    it("should delete wms store", async () => {
        geoserverRepository.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

        await geoserverRepository.deleteWmsStore(wmsStoreConfig);

        expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(type, wmsStoreConfig);
    });

    it("should return wms store request object", () => {
        const requestObject = geoserverRepository.wmsStoreRequestObject(wmsStoreConfig);

        expect(requestObject).to.be.eql({
            wmsStore: {
                name: wmsStoreConfig.name,
                description: wmsStoreConfig.label,
                type: "WMS",
                enabled: true,
                workspace: {
                    name: wmsStoreConfig.workspace ? wmsStoreConfig.workspace :
                        geoserverRepository.geoserver.workspace
                },
                capabilitiesURL: wmsStoreConfig.url,
                user: wmsStoreConfig.username,
                password: wmsStoreConfig.password,
                metadata: {},
                maxConnections: 6,
                readTimeout: 60,
                connectTimeout: 30
            }
        });
    });

});
