import * as assert from 'assert';
import fs = require('fs');
import path = require('path');


import $RefParser from "@apidevtools/json-schema-ref-parser";
import { NextOpenApi } from 'f5-conx-core/dist/bigip/nextModels';

const localOaiPath = path.join(__dirname, '..', '..', '..', 'openapi_nextCm.json');
const publicSchemaBasePath = path.join(__dirname, '..', '..', '..', 'schemas', 'nextCm');  //home/ted/projects/vscode-f5/schemas/nextCm
const apiSpec = fs.readFileSync(localOaiPath).toString();
const apiSpecOriginal = JSON.parse(apiSpec);
let apiSpecDeRefed: NextOpenApi;

type PathDeets = {
    path: string;
    method: string;
    schemaRef: string;
};

const pathsDeets: PathDeets[] = [];

suite('Generate NEXT schema files', () => {

    test('DeReference api spec', async () => {

        // dereference all the schemas only
        apiSpecDeRefed = await $RefParser.dereference(localOaiPath, {
            continueOnError: true
        })
        .then( x => {
            const v = x;
        })
        .catch( err => {
            // check out the errors...  over 1200
            const errors = err.errors;
            const message = err.message;
            return err.files.schema;
        });

        // make sure we have general structure
        assert.ok(apiSpecDeRefed.openapi);
        assert.ok(apiSpecDeRefed.components);
        assert.ok(apiSpecDeRefed.info);
        
        // Originally this was a $ref, make sure it's been dereferenced
        // @ts-expect-error
        assert.ok(apiSpecDeRefed.paths["/api/device/v1/inventory"].post.requestBody.content["application/json"].schema.properties);
        // @ts-expect-error
        assert.ok(apiSpecDeRefed.paths["/api/device/v1/inventory"].post.requestBody.content["application/json"].schema.required);
        
    }).timeout(10000);


    
    test('Filter out all the paths with post/put', async () => {
        
        // loop through all the paths
        Object.keys(apiSpecOriginal.paths).filter(x => {
            // get the keys for this path (ex. get/put/post/...)
            const methods = Object.keys(apiSpecOriginal.paths[x]);
            methods.forEach(method => {
                // capture the keys/methods we want
                if (method === 'post' || method === 'put') {

                    const schemaRef = apiSpecOriginal.paths[x][method].requestBody?.content['application/json']?.schema?.['$ref'];
                    if (schemaRef) {
                        
                        pathsDeets.push({
                            path: x,
                            method,
                            schemaRef
                        });
                    }
                }
            });

        });
        
        assert.ok(pathsDeets.length > 0);
        assert.ok( typeof pathsDeets[0].path === 'string');
        assert.ok( typeof pathsDeets[0].method === 'string');
        assert.ok( typeof pathsDeets[0].schemaRef === 'string');

        
    }).timeout(10000);

    
    test('deploy schemas as files for public vscode reference', async () => {
        

        // loop through all the paths
        pathsDeets.forEach(item => {
            const schemaRefName = item.schemaRef?.split('/').pop() as string;
            const filePath = path.join(publicSchemaBasePath, `${schemaRefName}.json`);
            const schema = apiSpecDeRefed.components.schemas[schemaRefName];
            if(schema) {
                // make sure we actually found the schema before we try to write it to a file
                fs.writeFileSync(filePath, JSON.stringify(schema, undefined, 4));
            } else {
                console.log('could not find schema for', item);
            }
        });
        
        const files = fs.readdirSync(publicSchemaBasePath);
        assert.ok(files.length >= 70); // as of 12.7.2022
        assert.ok(files.includes("DeviceDiscoveryRequest.json")); // schema reference most of this work has been based on as example

        
    }).timeout(10000);






});



