

/**
 * target/tenant/app index type
 *  - now includes app pieces
 * 
 * ```ts
 * const exmp = {
 *     "target": {
 *      "tenant": {
 *        "app": {
 *          Pool: 1,
 *          Service_HTTP: 1,
 *          ...
 *        },
 *      },
 *    },
 *  }
 * ```
 * 
 */
export interface As3AppMap {
    // parentType: 'targets' | 'tenants',
    [key: string]: {
        [key: string]: {}
    } | 'targets' | 'tenants'
}



/**
 * target/tenant/app/app-pieces index type
 * 
 * ```ts
 * const example = {
 *   target: "10.200.244.5",
 *   tenants: [
 *     {
 *       tenant: "core1_sample_01",
 *       apps: [
 *         {
 *           app: "A1",
 *           parts: {
 *             Pool: 1,
 *             Service_HTTP: 1,
 *           },
 *         },
 *       ],
 *     },
 *   ],
 * },
 * ```
 * 
 */
export interface As3AppMapTargets extends As3AppMapTenants {
    target: string;
    tenants: As3AppMapTenants
};


/**
 * tenant/app/app-pieces index type
 * 
 * ```ts
 * const example = {
 *   tenant: "core1_sample_01",
 *   apps: [
 *     {
 *       app: "A1",
 *       parts: {
 *         Pool: 1,
 *         Service_HTTP: 1,
 *       },
 *     },
 *   ],
 * },
 * ```
 * 
 */
export interface As3AppMapTenants {
    tenant: string;
    apps: {
        app: string;
        components: {};
    }[];
};




export interface As3App {
    class: 'Application',
    [key: string]: object | string,
}

export interface As3Declaration {
    class: 'AS3',
    $schema?: string,
    persist?: boolean;
    action?: string;
    declaration: AdcDeclaration | boolean | string
}

export interface As3Controls {
    archiveTimestamp: string;
}


export interface AdcDeclaration {
    id: string;
    class: 'ADC';
    target?: Target;
    updateMode: string;
    controls?: As3Controls;
    schemaVersion: string;
    [key: string]: As3Tenant | As3Controls | Target | string | boolean | undefined
}


export interface As3Tenant {
    class: 'Tenant',
    [key: string]: As3App | string
};

export interface Target {
    address?: string,
    hostname?: string
};


/**
 * primary as3 example with TS type declaration
 */
const exampleAs3Declaration: As3Declaration = {
    "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
    class: "AS3",
    "action": "deploy",
    "persist": true,
    "declaration": {
        "updateMode": "selective",
        "class": "ADC",
        "schemaVersion": "3.0.0",
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "Sample_01": {
            "class": "Tenant",
            "A1": {
                "class": "Application",
                "template": "http",
                "serviceMain": {
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ],
                    "pool": "web_pool"
                },
                "web_pool": {
                    "class": "Pool",
                    "monitors": [
                        "http"
                    ],
                    "members": [{
                        "servicePort": 80,
                        "serverAddresses": [
                            "192.0.1.10",
                            "192.0.1.11"
                        ]
                    }]
                }
            }
        }
    }
};


/**
 * primary as3 example with target parameter and TS type declaration
 */
const exampleAs3DeclarationWithTarget: As3Declaration = {
    "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
    class: "AS3",
    "action": "deploy",
    "persist": true,
    "declaration": {
        "updateMode": "selective",
        "class": "ADC",
        "target": {
            "address": "10.200.244.5"
        },
        "schemaVersion": "3.0.0",
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "Sample_01": {
            "class": "Tenant",
            "A1": {
                "class": "Application",
                "template": "http",
                "serviceMain": {
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ],
                    "pool": "web_pool"
                },
                "web_pool": {
                    "class": "Pool",
                    "monitors": [
                        "http"
                    ],
                    "members": [{
                        "servicePort": 80,
                        "serverAddresses": [
                            "192.0.1.10",
                            "192.0.1.11"
                        ]
                    }]
                }
            }
        }
    }
};


/**
 * as3 /declare endpoint output for bigiq with multiple targets
 */
const As3DeclareEndpoint: AdcDeclaration[] = [
    {
        id: "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        class: "ADC",
        target: {
            address: "10.200.244.5",
        },
        updateMode: "selective",
        schemaVersion: "3.0.0",
        core1_sample_01: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.1.10",
                                "192.0.1.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_01/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.1.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
        core1_sample_02: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.2.10",
                                "192.0.2.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_02/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.2.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
    },
    {
        id: "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        class: "ADC",
        target: {
            address: "10.200.244.6",
        },
        updateMode: "selective",
        schemaVersion: "3.0.0",
        core1_sample_02: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.2.10",
                                "192.0.2.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_02/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.2.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
        core1_sample_01: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.1.10",
                                "192.0.1.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_01/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.1.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
    },
    {
        id: "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        class: "ADC",
        target: {
            address: "192.168.200.131",
        },
        updateMode: "selective",
        schemaVersion: "3.0.0",
        tparty_sample_01: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "19.0.1.20",
                                "19.0.1.21",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/tparty_sample_01/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "19.0.1.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
        tparty_sample_02: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "19.0.2.20",
                                "19.0.2.21",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/tparty_sample_02/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "19.0.2.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
    },
];


/**
 * as3 /declare endpoint output for bigip, no targets tenants only
 */
const as3DeclarationEndpointLTM: AdcDeclaration = {
    tparty_sample_02: {
        A1: {
            class: "Application",
            template: "http",
            web_pool: {
                class: "Pool",
                members: [
                    {
                        servicePort: 80,
                        serverAddresses: [
                            "19.0.2.20",
                            "19.0.2.21",
                        ],
                    },
                ],
                monitors: [
                    "http",
                ],
            },
            serviceMain: {
                pool: "/tparty_sample_02/A1/web_pool",
                class: "Service_HTTP",
                virtualAddresses: [
                    "19.0.2.10",
                ],
            },
        },
        class: "Tenant",
    },
    tparty_sample_01: {
        A1: {
            class: "Application",
            template: "http",
            web_pool: {
                class: "Pool",
                members: [
                    {
                        servicePort: 80,
                        serverAddresses: [
                            "19.0.1.20",
                            "19.0.1.21",
                        ],
                    },
                ],
                monitors: [
                    "http",
                ],
            },
            serviceMain: {
                pool: "/tparty_sample_01/A1/web_pool",
                class: "Service_HTTP",
                virtualAddresses: [
                    "19.0.1.10",
                ],
            },
        },
        class: "Tenant",
    },
    Sample_01: {
        class: "Tenant",
        A1: {
            class: "Application",
            template: "http",
            serviceMain: {
                class: "Service_HTTP",
                virtualAddresses: [
                    "10.0.1.10",
                ],
                pool: "web_pool",
            },
            web_pool: {
                class: "Pool",
                monitors: [
                    "http",
                ],
                members: [
                    {
                        servicePort: 80,
                        serverAddresses: [
                            "192.0.1.10",
                            "192.0.1.11",
                        ],
                    },
                ],
            },
        },
    },
    class: "ADC",
    schemaVersion: "3.23.0",
    id: "urn:uuid:47fdeacb-804d-43d4-8b8e-836cb4b7ae09",
    label: "Converted Declaration",
    remark: "Auto-generated by Project Charon",
    Common: {
        class: "Tenant",
        Shared: {
            class: "Application",
            template: "shared",
            app1_t80_vs: {
                layer4: "tcp",
                iRules: [
                    {
                        bigip: "/Common/_sys_https_redirect",
                    },
                ],
                translateServerAddress: true,
                translateServerPort: true,
                class: "Service_HTTP",
                profileHTTP: {
                    bigip: "/Common/http",
                },
                profileTCP: {
                    bigip: "/Common/tcp",
                },
                virtualAddresses: [
                    "192.168.1.21",
                ],
                virtualPort: 80,
                persistenceMethods: [
                ],
                snat: "none",
            },
            app1_t443_vs: {
                layer4: "tcp",
                pool: "app1_t80_pool",
                translateServerAddress: true,
                translateServerPort: true,
                class: "Service_HTTP",
                profileHTTP: {
                    bigip: "/Common/http",
                },
                profileTCP: {
                    bigip: "/Common/tcp",
                },
                virtualAddresses: [
                    "192.168.1.21",
                ],
                virtualPort: 443,
                persistenceMethods: [
                ],
                snat: "auto",
            },
            app1_t80_pool: {
                members: [
                    {
                        addressDiscovery: "static",
                        servicePort: 80,
                        serverAddresses: [
                            "192.168.1.22",
                            "192.168.1.23",
                        ],
                        shareNodes: true,
                    },
                ],
                monitors: [
                    {
                        bigip: "/Common/http",
                    },
                    {
                        bigip: "/Common/tcp",
                    },
                ],
                class: "Pool",
            },
        },
    },
    updateMode: "selective",
    controls: {
        archiveTimestamp: "2021-01-27T19:38:38.359Z",
    },
};