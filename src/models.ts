





/**
 * extension device model
 */
export type Device = {
    device: string,
    provider?: string,
    onConnect?: string[],
    onDisconnect?: string[]
};