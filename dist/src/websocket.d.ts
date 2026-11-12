import { EventEmitter } from "node:events";
export declare enum CAIWebsocketConnectionType {
    Disconnected = 0,
    DM = 1,
    GroupChat = 2
}
export interface ICAIWebsocketCreation {
    url: string;
    edgeRollout: string;
    authorization: string;
    userId: number;
}
export interface ICAIWebsocketMessage {
    data: any;
    parseJSON: boolean;
    expectedReturnCommand?: string;
    messageType: CAIWebsocketConnectionType;
    waitForAIResponse: boolean;
    streaming: boolean;
    expectedRequestId?: string;
    fireAndForget?: boolean;
}
export interface ICAIWebsocketCommand {
    command: string;
    expectedReturnCommand?: string;
    originId: "Android" | "web-next";
    waitForAIResponse?: boolean;
    streaming: boolean;
    payload: any;
    fireAndForget?: boolean;
}
export declare class CAIWebsocket extends EventEmitter {
    private address;
    private cookie;
    private userId;
    private websocket?;
    private pending;
    private _connected;
    get connected(): boolean;
    withCheck: boolean;
    open(withCheck: boolean): Promise<CAIWebsocket>;
    private onMessage;
    private processPacket;
    sendAsync(options: ICAIWebsocketMessage): Promise<unknown>;
    close(): void;
    constructor(options: ICAIWebsocketCreation);
}
//# sourceMappingURL=websocket.d.ts.map