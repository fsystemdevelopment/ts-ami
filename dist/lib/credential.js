"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ini_extended_1 = require("ini-extended");
var fs_1 = require("fs");
var path = require("path");
var astConfPath = path.join("/etc", "asterisk");
;
function retrieveCredential(params) {
    params || (params = {});
    var filePath = path.join(params.astConfPath || astConfPath, "manager.conf");
    if (!fs_1.existsSync(filePath))
        throw new Error("NO_FILE");
    var config = ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(filePath, "utf8"));
    var general = config.general || {};
    var port = general.port ? parseInt(general.port) : 5038;
    var host = (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";
    delete config.general;
    if (params.user && !config[params.user])
        throw new Error("User " + params.user + " not found in config file");
    var usersToTest = params.user ? [params.user] : Object.keys(config);
    try {
        for (var usersToTest_1 = __values(usersToTest), usersToTest_1_1 = usersToTest_1.next(); !usersToTest_1_1.done; usersToTest_1_1 = usersToTest_1.next()) {
            var userName = usersToTest_1_1.value;
            var userConfig = config[userName];
            if (!userConfig.secret ||
                !userConfig.write ||
                !userConfig.read)
                continue;
            if (isGranted(getListAuthority(userConfig.read)) &&
                isGranted(getListAuthority(userConfig.write))) {
                if (general.enabled !== "yes")
                    throw new Error("NOT_ENABLED");
                return {
                    port: port,
                    host: host,
                    "user": userName,
                    "secret": userConfig.secret
                };
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (usersToTest_1_1 && !usersToTest_1_1.done && (_a = usersToTest_1.return)) _a.call(usersToTest_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    throw Error("NO_USER");
    var e_1, _a;
}
exports.retrieveCredential = retrieveCredential;
function getListAuthority(strList) {
    strList = strList.replace(/\ /g, "");
    return strList.split(",");
}
function isGranted(list) {
    return true;
    /*

    let hasUser = false;
    let hasSystem = false;
    let hasConfig = false;

    for (let authority of list) {

        if (authority.toLowerCase() === "all")
            return true;

        if (authority.toLocaleLowerCase() === "user")
            hasUser = true;

        if (authority.toLocaleLowerCase() === "system")
            hasSystem = true;

        if (authority.toLocaleLowerCase() === "config")
            hasConfig = true;

    }

    return hasUser && (hasSystem || hasConfig);

    */
}
//# sourceMappingURL=credential.js.map