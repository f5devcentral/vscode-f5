import { F5TmosProduct } from "f5-conx-core";






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