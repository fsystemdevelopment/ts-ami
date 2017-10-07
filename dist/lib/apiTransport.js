"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var ts_events_extended_1 = require("ts-events-extended");
var Ami_1 = require("./Ami");
var textSplit_1 = require("./textSplit");
var timer_extended_1 = require("timer-extended");
var superJson = require("super-json");
var JSON;
(function (JSON) {
    var myJson = superJson.create({
        "magic": '#!',
        "serializers": [
            superJson.dateSerializer,
            {
                "serialize": function (error) { return [error.message]; },
                "deserialize": function (message) { return new Ami_1.Ami.RemoteError(message); },
                "isInstance": function (obj) { return obj instanceof Error; },
                "name": "Error"
            }
        ]
    });
    function stringify(obj) {
        if (obj === undefined) {
            return "undefined";
        }
        return myJson.stringify([obj]);
    }
    JSON.stringify = stringify;
    function parse(str) {
        if (str === "undefined") {
            return undefined;
        }
        return myJson.parse(str).pop();
    }
    JSON.parse = parse;
})(JSON || (JSON = {}));
var Message;
(function (Message) {
    var packetCountKey = "packet_count";
    var packetIndexKey = "packet_index";
    var partCountKey = "part_count";
    var partKey = function (index) { return "part" + index; };
    var messageIdKey = "message_id";
    function buildUserEvents(message, userevent) {
        var id = message.id, payload = message.payload;
        var packets = textSplit_1.textSplit(50000, textSplit_1.b64Enc(JSON.stringify(payload)));
        var userEvents = [];
        for (var i = 0; i < packets.length; i++) {
            var userEvent = { userevent: userevent, "actionid": Ami_1.Ami.generateUniqueActionId() };
            userEvent[messageIdKey] = id;
            userEvent[packetCountKey] = "" + packets.length;
            userEvent[packetIndexKey] = "" + i;
            var parts = textSplit_1.textSplit(Ami_1.Ami.headerValueMaxLength, packets[i]);
            userEvent[partCountKey] = "" + parts.length;
            for (var j = 0; j < parts.length; j++) {
                userEvent[partKey(j)] = parts[j];
            }
            userEvents.push(userEvent);
        }
        return userEvents;
    }
    function makeSendMessage(ami, userevent) {
        var _this = this;
        return function (message) { return __awaiter(_this, void 0, void 0, function () {
            var tasks, _loop_1, _a, _b, userEvent, e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        tasks = [];
                        _loop_1 = function (userEvent) {
                            tasks.push(ami.userEvent(userEvent));
                            ami.evtUserEvent.attachOnceExtract(function (_a) {
                                var actionid = _a.actionid;
                                return actionid === userEvent.actionid;
                            });
                        };
                        try {
                            for (_a = __values(buildUserEvents(message, userevent)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                userEvent = _b.value;
                                _loop_1(userEvent);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [4 /*yield*/, Promise.all(tasks)];
                    case 1:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        }); };
    }
    Message.makeSendMessage = makeSendMessage;
    function parseUserEvents(userEvents) {
        var userevent = userEvents[0].userevent;
        var id = userEvents[0][messageIdKey];
        var payloadEnc = "";
        try {
            for (var userEvents_1 = __values(userEvents), userEvents_1_1 = userEvents_1.next(); !userEvents_1_1.done; userEvents_1_1 = userEvents_1.next()) {
                var userEvent = userEvents_1_1.value;
                var length = parseInt(userEvent[partCountKey]);
                var payloadEncPart = "";
                for (var i = 0; i < length; i++)
                    payloadEncPart += userEvent[partKey(i)];
                payloadEnc += payloadEncPart;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (userEvents_1_1 && !userEvents_1_1.done && (_a = userEvents_1.return)) _a.call(userEvents_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var payload = JSON.parse(textSplit_1.b64Dec(payloadEnc));
        return { id: id, payload: payload };
        var e_2, _a;
    }
    function makeEvtMessage(ami, userevent) {
        var evtMessage = new ts_events_extended_1.SyncEvent();
        var evtUserEvent = new ts_events_extended_1.SyncEvent();
        ami.evtUserEvent.attach(evtUserEvent);
        evtUserEvent.attach(function (userEvent) { return userEvent.userevent === userevent; }, function (userEvent) {
            var userEvents = [];
            var id = userEvent[messageIdKey];
            var packetCount = parseInt(userEvent[packetCountKey]);
            var timer = timer_extended_1.setTimer(function () { return evtUserEvent.detach(userEvents); }, 3000);
            evtUserEvent.attachExtract(function (userEvent) { return (userEvent[messageIdKey] === id &&
                userEvent.userevent === userevent); }, userEvents, function (userEvent) {
                userEvents[userEvent[packetIndexKey]] = userEvent;
                if (!--packetCount) {
                    timer.runNow();
                    evtMessage.post(parseUserEvents(userEvents));
                }
                else {
                    timer.resetDelay();
                }
            });
            evtUserEvent.post(userEvent);
        });
        return evtMessage;
    }
    Message.makeEvtMessage = makeEvtMessage;
})(Message || (Message = {}));
var requestUserevent = "API_REQUEST_doOOdlP3d";
var responseUserevent = "API_RESPONSE_aoZksOdd";
var eventUserevent = "API_EVENT_doeODkOd";
var AmiApiServer = /** @class */ (function () {
    function AmiApiServer(ami) {
        var _this = this;
        this.ami = ami;
        this.evtRequest = new ts_events_extended_1.SyncEvent();
        this.sendEvent = Message.makeSendMessage(this.ami, eventUserevent);
        var sendResponse = Message.makeSendMessage(ami, responseUserevent);
        var resolveOrReject = function (id, payload) { return sendResponse({ id: id, payload: payload }); };
        Message.makeEvtMessage(ami, requestUserevent).attach(function (_a) {
            var id = _a.id, payload = _a.payload;
            return _this.evtRequest.post({
                "method": payload.method,
                "params": payload.params,
                "resolve": function (returnValue) { return resolveOrReject(id, returnValue); },
                "reject": function (error) { return resolveOrReject(id, error); }
            });
        });
    }
    AmiApiServer.prototype.postEvent = function (name, event) {
        return this.sendEvent({
            "id": Ami_1.Ami.generateUniqueActionId(),
            "payload": { name: name, event: event }
        });
    };
    return AmiApiServer;
}());
exports.AmiApiServer = AmiApiServer;
var AmiApiClient = /** @class */ (function () {
    function AmiApiClient(ami) {
        var _this = this;
        this.ami = ami;
        this.evtEvent = new ts_events_extended_1.SyncEvent();
        this.sendRequest = Message.makeSendMessage(this.ami, requestUserevent);
        this.evtResponse = Message.makeEvtMessage(this.ami, responseUserevent);
        Message.makeEvtMessage(ami, eventUserevent).attach(function (_a) {
            var payload = _a.payload;
            return _this.evtEvent.post(payload);
        });
    }
    AmiApiClient.prototype.makeRequest = function (method, params, timeout) {
        if (timeout === void 0) { timeout = 5000; }
        return __awaiter(this, void 0, void 0, function () {
            var requestId, payload, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        requestId = Ami_1.Ami.generateUniqueActionId();
                        this.sendRequest({ "id": requestId, "payload": { method: method, params: params } });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.evtResponse.waitFor(function (_a) {
                                var id = _a.id;
                                return id === requestId;
                            }, timeout)];
                    case 2:
                        payload = (_b.sent()).payload;
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        throw new Ami_1.Ami.TimeoutError(method, timeout);
                    case 4:
                        if (payload instanceof Error) {
                            throw payload;
                        }
                        else {
                            return [2 /*return*/, payload];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return AmiApiClient;
}());
exports.AmiApiClient = AmiApiClient;
