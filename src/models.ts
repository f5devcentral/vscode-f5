import { F5TmosProduct } from "f5-conx-core";
import { Stats, TmosApp } from "f5-corkscrew";



export type CfgExploreReport = {
    Greeting: string;
    repo: string;
    extensionVersion: string;
    corkscrewVersion: string;
    issues: string;
    documentation: string;
    label?: string;
    description?: string;
    id: string;
    dateTime: Date;
    hostname?: string;
    inputFileType: string;
    sourceFileCount?: number;
    appCount?: number;
    cfgExploreStats: Stats;
    cfgExploreParsedFiles: string[];
    xcDiagStats?: {
        Green?: number;
        Error?: number;
        Warning?: number;
        Information?: number;
        defaultRedirects: number;
    };
    xcDiags?: {
        Green?: string[];
        Information?: {
            appName: string;
            diagnostics: string[];
        }[];
        Warning?: {
            appName: string;
            diagnostics: string[];
        }[];
        Error?: {
            appName: string;
            diagnostics: string[];
        }[];
        defaultRedirects: string[];
    }
    apps: TmosAppReport[];
    gslb?: any;
};

export interface TmosAppReport extends TmosApp {
    xcDiagnostics: string[]
    xcDiagStats: unknown;
    xcDiagStatus: string;
}

/**
 * extension device model for hosts view
 */
export type BigipHost = {
    device: string,
    label?: string,
    folder?: string,
    product?: F5TmosProduct;
    details?: {
        platformMarketingName?: string;
        version?: string;
        hostname?: string;
        managementAddress?: string;
        platform?: string;
        physicalMemory?: number;
    }
    provider: string,
    onConnect?: string[],
    onDisconnect?: string[]
};