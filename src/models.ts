





/**
 * extension device model for hosts view
 */
export type BigipHost = {
    device: string,
    label?: string,
    folder?: string,
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