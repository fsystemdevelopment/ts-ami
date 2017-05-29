import { retrieveCredential, Credential } from "./credential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import * as pr from "ts-promisify";
import { Base64 } from "js-base64";

export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}

export const lineMaxByteLength= 1024;

export const generateUniqueActionId = (() => {

    let counter = Date.now();

    return (): string => (counter++).toString();

})();

export class Ami {

    private static localClient: Ami | undefined = undefined;

    public static localhost(params?: {
        astConfPath?: string;
        user?: string;
    }): Ami {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(retrieveCredential(params));

    };

    public readonly ami: any;

    public readonly evt = new SyncEvent<ManagerEvent>();

    private isFullyBooted = false;

    constructor(credential: Credential) {

        let { port, host, user, secret } = credential;

        this.ami = new AstMan(port, host, user, secret, true);

        this.ami.setMaxListeners(Infinity);

        this.ami.keepConnected();

        this.ami.on("managerevent", evt => this.evt.post(evt));
        this.ami.on("fullybooted", () => { this.isFullyBooted = true; });
        this.ami.on("close", () => { this.isFullyBooted = false; });

    }


    public lastActionId: string = "";

    public postAction(action: {
        action: string;
        variable?: string | { [key: string]: string };
        [key: string]: any;
    }): Promise<any> {

        return new Promise<void>(async (resolve, reject) => {

            let line: string;

            for (let key of Object.keys(action)) {

                line = `${key}: ${action[key]}\r\n`;

                if (Buffer.byteLength(line) > lineMaxByteLength)
                    throw new Error(`Line too long: ${line}`);

            }

            if (!action.actionid)
                action.actionid = generateUniqueActionId();

            this.lastActionId = action.actionid;

            if (!this.isFullyBooted)
                await pr.generic(this.ami, this.ami.once)("fullybooted");

            this.ami.action(
                action,
                (error, res) => error ? reject(error) : resolve(res)
            );

        });

    }

    public readonly messageSend = (
        to: string,
        from: string,
        body: string,
        headers?: { [header: string]: string; }
    ) => this.postAction({
        "action": "MessageSend",
        to,
        from,
        "variable": headers || {},
        "base64body": Base64.encode(body)
    });

    public async setVar(
        variable: string,
        value: string,
        channel?: string
    ){

        let action = { "action": "SetVar", variable, value };

        if( channel ) action= { ...action, channel };

        await this.postAction(action);

    }

    public async getVar(
        variable: string,
        channel?: string
    ): Promise<string> {

        let action= { "action": "GetVar", variable };

        if( channel ) action= { ...action, channel };

        return (await this.postAction(action)).value;

    }




    public async dialplanExtensionAdd(
        context: string,
        extension: string,
        priority: number | string,
        application: string,
        applicationData?: string,
        replace?: boolean
    ) {

        let action = {
            "action": "DialplanExtensionAdd",
            extension,
            "priority": `${priority}`,
            context,
            application
        };

        if (applicationData) action["applicationdata"] = applicationData;

        if (replace !== false ) action["replace"] = `${true}`;

        let res= await this.postAction(action);


    }

    public async runCliCommand(cliCommand: string): Promise<string> {

        try {

            let resp = await this.postAction({
                "action": "Command",
                "Command": cliCommand
            });

            if( "content" in resp ) return resp.content;
            else{

                let { output } = resp;

                return (typeof output === "string" )?output:output.join("\n");

            }


        } catch (errorResp) {

            if( "output" in errorResp ) return errorResp.output.join("\n");

            throw errorResp;

        }

    }

    public async dialplanExtensionRemove(
        context: string,
        extension: string,
        priority?: number | string
    ): Promise<boolean> {


        let action = { "action": "DialplanExtensionRemove", context, extension };

        if (priority !== undefined) action = { ...action, "priority": `${priority}` };

        try {

            await this.postAction(action);

            return true;

        } catch (error) {

            return false;
        }


    }

    public async removeContext(context: string): Promise<string> {

        return await this.runCliCommand(
            `dialplan remove context ${context}`
        );

    }

    public async originateLocalChannel(
        context: string,
        extension: string,
        variable?: { [key: string]: string; }
    ) {

        variable= variable || {};

        let action = {
            "action": "originate",
            "channel": `Local/${extension}@${context}`,
            "application": "Wait",
            "data": "2000",
            variable
        };

        await this.postAction(action);

    }


    public disconnect(): void {
        this.ami.disconnect();
    }

}