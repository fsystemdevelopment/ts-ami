import { getCredentialFromConfigFile } from "../lib/credential";
import * as path from "path";

try {

    let astConfPath = path.join(__dirname, "..", "..", "res", "no_file");

    getCredentialFromConfigFile({ astConfPath });

} catch (error) {
    console.assert(error.message === "NO_FILE");
}


try {

    let astConfPath = path.join(__dirname, "..", "..", "res", "disabled");

    getCredentialFromConfigFile({ astConfPath });

} catch (error) {
    console.assert(error.message === "NOT_ENABLED");
}


try {


    let astConfPath = path.join(__dirname, "..", "..", "res", "no_user");

    getCredentialFromConfigFile({ astConfPath });

} catch (error) {
    console.assert(error.message === "NO_USER");
}


let astConfPath = path.join(__dirname, "..", "..", "res", "pass");



let credential = getCredentialFromConfigFile({ astConfPath });

console.assert(
    credential.port === 5038 &&
    credential.host === "127.0.0.1" &&
    credential.user === "admin" &&
    credential.secret === "admin"
);

credential = getCredentialFromConfigFile({ astConfPath, "user": "my-user" });

console.assert(
    credential.port === 5038 &&
    credential.host === "127.0.0.1" &&
    credential.user === "my-user" &&
    credential.secret === "my-password"
);

console.log("PASS credential");