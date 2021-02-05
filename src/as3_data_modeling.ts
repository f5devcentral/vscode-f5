

interface As3App {
    class: 'Application',
    [key: string]: object | string, 
}

interface As3Declaration {
    class: 'AS3',
    [key: string]: AdcDeclaration | string
}


interface AdcDeclaration {
    id: string;
    class: string;
    target?: {
        address: string;
    };
    updateMode: string;
    schemaVersion: string;
    [key: string]: As3Tenant | string | Target
}


interface As3Tenant {
    class: 'Tenant',
    [key: string]: As3App | string
};

interface Target {
    address?: string,
    hostname?: string
};


const some: AdcDeclaration[] = [
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
  ]