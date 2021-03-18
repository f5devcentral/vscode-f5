





/**
 * extension device model
 */
export type BigipHost = {
    device: string,
    label?: string,
    details?: {
        product?: string;
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