import fs = require('fs');
import path = require('path');

import { OpenApiValidator } from 'openapi-data-validator';

const localOaiPath = path.join(__dirname, '..', '..', '..', 'openapi_nextCm_minor.json');
const apiSpec = JSON.parse(fs.readFileSync(localOaiPath).toString());

suite('NEXT CM OpenApi Schema Validation', () => {


    test('simple validate', async () => {

        const body = {
            "address": "10.145.10.1",
            "device_password": "admin",
            "device_user": "admin",
            "management_password": "admin",
            "management_user": "sample_mgmt_admin",
            "port": "5443"
        };


        const req = {
            method: "POST",
            route: "/api/device/v1/inventory",
            body
        };

        const openApiValidator = new OpenApiValidator({
            apiSpec,
            validateRequests: {
                allowUnknownQueryParameters: true
            }
        });

        const validator = openApiValidator.createValidator();

        await validator(req)
            .then(x => {
                const v = x;
                console.log(v);
            })
            .catch(err => {
                const zz = err;
                console.log(zz);
            });


    }).timeout(10000);


});



