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

                if (key === "variable" && typeof(action.variable) === "object" ) {

                    let variable = action.variable;

                    line = `Variable: `;

                    for (let variableKey of Object.keys(variable))
                        line += `${variableKey}=${variable[variableKey]},`;

                    line = line.slice(0, -1) + "\r\n";

                } else line = `${key}: ${action[key]}\r\n`;


                if (Buffer.byteLength(line) > lineMaxByteLength)
                    throw new Error(`Line too long: ${line}`);

            }

            if (!action.actionid)
                action.actionid = generateUniqueActionId();

            this.lastActionId = action.actionid;

            //TODO:  warning: possible EventEmitter memory leak detected. 
            //11 fullybooted listeners added. Use emitter.setMaxListeners() to increase limit.

            if (!this.isFullyBooted)
                await pr.generic(this.ami, this.ami.once)("fullybooted");

            this.ami.actionExpectSingleResponse(
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

    //Only with asterisk 14+ ( broken in asterisk )
    public async runCliCommand(cliCommand: string): Promise<string> {

        try {

            let { output } = await this.postAction({
                "action": "Command",
                "Command": cliCommand
            });

            return output.join("\n");

        } catch ({ output }) {

            throw new Error(output.join("\n"));

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

    //Only Asterisk 14+
    public async removeContext(context: string): Promise<boolean> {

        let cliCommand = `dialplan remove context ${context}`;

        try {

            await this.runCliCommand(cliCommand);

            return true;

        } catch (error) {

            return false;

        }

    }

    public async originateLocalChannel(
        context: string,
        extension: string
    ) {

        await this.postAction({
            "action": "originate",
            "channel": `Local/${extension}@${context}`,
            "application": "Wait",
            "data": "2000"
        });

    }


    public disconnect(): void {
        this.ami.disconnect();
    }

}