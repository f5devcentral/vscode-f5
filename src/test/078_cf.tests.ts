/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import nock from 'nock';

import { getF5Client, ipv6Host } from 'f5-conx-core';
// import { getF5Client, ipv6Host } from 'f5-conx-core/utils/testingUtils';
import { getFakeToken } from 'f5-conx-core';
import { AuthTokenReqBody } from 'f5-conx-core';
import {  atcMetaData, iControlEndpoints } from 'f5-conx-core';
import { F5Client } from 'f5-conx-core';
import { cfInfoApiReponse, deviceInfoIPv6 } from 'f5-conx-core/dist/';
import { cfInfoApiReponse, deviceInfoIPv6 } from 'f5-conx-core/dist/artifacts/f5_device_atc_infos';
import { isArray, isObject } from 'f5-conx-core';
import { 
    cfExampleDec,
    cfGetDeclareResp,
    cfGetTriggerResp,
    cfInspectResp,
    cfPostDeclareResp,
    cfPostResetResp,
    cfPostTriggerDrResp,
    cfPostTriggerResp
} from 'f5-conx-core';


let f5Client: F5Client;
let nockInst: nock.Scope;
let events = [];

describe('cfClient integration tests', function () {

    before(function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename);
    })

    before()
    lo
    
    beforeEach(async function () {

        // clear events
        events = [];

        nockInst = nock(`https://${ipv6Host}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover endpoint
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfoIPv6)
            .get(atcMetaData.cf.endPoints.info)
            .reply(200, cfInfoApiReponse)

        f5Client = getF5Client({ ipv6: true });

        f5Client.events.on('failedAuth', msg => events.push(msg));
        f5Client.events.on('log-debug', msg => events.push(msg));
        f5Client.events.on('log-info', msg => events.push(msg));
        f5Client.events.on('log-error', msg => events.push(msg));

        await f5Client.discover();
    });

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();

        // clear token timer if something failed
        await f5Client.clearLogin();   // clear auth token for next test
    });




    it('get cf version information', async function () {

        // clear nocks since we aren't using them for this test
        nock.cleanAll();

        assert.ok(isObject(f5Client.cf.version), 'no cf version object detected');
        assert.ok(f5Client.cf.version.release, 'no cf release information detected');

    });



    it('get cf version information - fail (cf not installed)', async function () {

        // clear the original token timer - so it doesn't just keep running...
        await f5Client.clearLogin();

        // overwrite instantiation where no AS3 is installed
        nockInst = nock(`https://${ipv6Host}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover with no AS3
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfoIPv6)


        f5Client = getF5Client({ ipv6: true });
        await f5Client.discover()

        const x = isObject(f5Client.cf?.version)
        // this test can/should fail if testing against real f5 with AS3 service...
        assert.deepStrictEqual(x, false, 'cf should not be installed');

        await f5Client.clearLogin();
    });

    
    it('get /inspect', async function () {

        nockInst
            .get(atcMetaData.cf.endPoints.inspect)
            .reply(200, cfInspectResp)

        const resp = await f5Client.cf.inspect();

        assert.deepStrictEqual(resp.data, cfInspectResp);
    });


    it('get /declare', async function () {

        nockInst
            .get(atcMetaData.cf.endPoints.declare)
            .reply(200, cfGetDeclareResp)

        const resp = await f5Client.cf.getDeclare();

        assert.deepStrictEqual(resp.data, cfGetDeclareResp);
    });


    it('post /declare', async function () {

        nockInst
            .post(atcMetaData.cf.endPoints.declare)
            .reply(200, cfPostDeclareResp)

        const resp = await f5Client.cf.postDeclare(cfExampleDec);

        assert.deepStrictEqual(resp.data, cfPostDeclareResp);
    });


    it('get /trigger', async function () {

        nockInst
            .get(atcMetaData.cf.endPoints.trigger)
            .reply(200, cfGetTriggerResp)

        const resp = await f5Client.cf.getTrigger();

        assert.deepStrictEqual(resp.data, cfGetTriggerResp);
    });


    it('post /trigger (dry-run)', async function () {

        nockInst
            .post(atcMetaData.cf.endPoints.trigger)
            .reply(200, cfPostTriggerDrResp)

        const resp = await f5Client.cf.trigger('dry-run');

        assert.deepStrictEqual(resp.data, cfPostTriggerDrResp);
    });


    it('post /trigger', async function () {

        nockInst
            .post(atcMetaData.cf.endPoints.trigger)
            .reply(200, cfPostTriggerResp)

        const resp = await f5Client.cf.trigger();

        assert.deepStrictEqual(resp.data, cfPostTriggerResp);
    });


    it('post /reset', async function () {

        nockInst
            .post(atcMetaData.cf.endPoints.reset)
            .reply(200, cfPostResetResp)

        const resp = await f5Client.cf.reset();

        assert.deepStrictEqual(resp.data, cfPostResetResp);
    });

});