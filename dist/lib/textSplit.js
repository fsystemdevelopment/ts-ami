"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lineMaxByteLength = 1024;
var safeOffsetBytes = Buffer.byteLength("Variable: A_VERY_LONG_VARIABLE_NAME_TO_BE_REALLY_SAFE=" + "\r\n");
function splitStep(nByte, text, encodeFunction) {
    for (var index = 0; index < text.length; index++) {
        if (Buffer.byteLength(encodeFunction(text.substring(0, index + 1))) > nByte) {
            if (index === 0)
                throw new Error("nByte to small to split this string with this encoding");
            return [encodeFunction(text.substring(0, index)), text.substring(index, text.length)];
        }
    }
    return [encodeFunction(text), ""];
}
function performSplit(maxByte, text, encodingFunction) {
    function callee(state, rest) {
        if (!rest)
            return state;
        var _a = __read(splitStep(maxByte, rest, encodingFunction), 2), encodedPart = _a[0], newRest = _a[1];
        state.push(encodedPart);
        return callee(state, newRest);
    }
    return callee([], text);
}
function generalCaseTextSplit(text, encodeFunction, maxBytePerPart, offsetBytes) {
    if (typeof (offsetBytes) === "number")
        maxBytePerPart = maxBytePerPart - offsetBytes;
    var out = performSplit(maxBytePerPart, text, encodeFunction);
    if (!out.length)
        out.push("");
    return out;
}
function textSplit(text, encodeFunction) {
    return generalCaseTextSplit(text, encodeFunction, lineMaxByteLength - 1, safeOffsetBytes);
}
exports.textSplit = textSplit;
function base64TextSplit(text) {
    return textSplit(text, function (str) { return (new Buffer(str, "utf8")).toString("base64"); });
}
exports.base64TextSplit = base64TextSplit;
