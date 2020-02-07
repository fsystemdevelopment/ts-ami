import { Evt } from "ts-evt";
import { Ami } from "./Ami";
export declare class Server {
    readonly ami: Ami;
    private readonly apiId;
    readonly evtRequest: Evt<{
        method: string;
        params: any;
        resolve(returnValue: any): Promise<void>;
        reject(error: Error): Promise<void>;
    }>;
    constructor(ami: Ami, apiId: string);
    private readonly sendEvent;
    postEvent(name: string, event: any): Promise<void>;
}
export declare class Client {
    readonly ami: Ami;
    private readonly apiId;
    readonly evtEvent: Evt<{
        name: string;
        event: any;
    }>;
    constructor(ami: Ami, apiId: string);
    private readonly sendRequest;
    private readonly evtResponse;
    makeRequest(method: string, params?: any, timeout?: number): Promise<any>;
}
export declare class TimeoutError extends Error {
    constructor(method: string, timeout: number);
}
export declare class RemoteError extends Error {
    constructor(message: string);
}
