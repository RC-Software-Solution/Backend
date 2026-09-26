const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { Op } = require("sequelize");

// Stub firebase-admin and the User model before loading the service,
// so no Firebase credentials or DB connection are needed.
const calls = { send: [], multicast: [], update: [] };
let sendImpl;
let multicastImpl;

const fakeAdmin = {
    apps: [{}], // non-empty: skip initializeApp
    messaging: () => ({
        send: async (msg) => { calls.send.push(msg); return sendImpl(msg); },
        sendEachForMulticast: async (msg) => { calls.multicast.push(msg); return multicastImpl(msg); },
    }),
};
const fakeUser = { update: async (values, opts) => { calls.update.push({ values, opts }); } };

function stub(id, exports) {
    require.cache[id] = { id, filename: id, loaded: true, exports };
}
stub(require.resolve("firebase-admin"), fakeAdmin);
stub(path.join(__dirname, "..", "models", "User.js"), fakeUser);

const { sendPushNotification, sendToMany } = require("./notificationService");

const fcmError = (code) => Object.assign(new Error(code), { code });

beforeEach(() => {
    calls.send.length = 0;
    calls.multicast.length = 0;
    calls.update.length = 0;
    sendImpl = async () => "msg-id";
    multicastImpl = async ({ tokens }) => ({
        successCount: tokens.length,
        failureCount: 0,
        responses: tokens.map(() => ({ success: true })),
    });
});

test("sendPushNotification returns true on success", async () => {
    assert.equal(await sendPushNotification("tok", "T", "B"), true);
    assert.deepEqual(calls.send[0], { notification: { title: "T", body: "B" }, token: "tok" });
});

test("sendPushNotification returns false instead of throwing, and clears a dead token", async () => {
    sendImpl = async () => { throw fcmError("messaging/registration-token-not-registered"); };
    assert.equal(await sendPushNotification("dead", "T", "B"), false);
    assert.equal(calls.update.length, 1);
    assert.deepEqual(calls.update[0].values, { fcm_token: null });
    assert.deepEqual(calls.update[0].opts.where.fcm_token[Op.in], ["dead"]);
});

test("sendPushNotification keeps the token on transient errors", async () => {
    sendImpl = async () => { throw fcmError("messaging/internal-error"); };
    assert.equal(await sendPushNotification("tok", "T", "B"), false);
    assert.equal(calls.update.length, 0);
});

test("sendToMany sends in batches of 500", async () => {
    const tokens = Array.from({ length: 1201 }, (_, i) => `t${i}`);
    const result = await sendToMany(tokens, "T", "B");
    assert.deepEqual(calls.multicast.map((m) => m.tokens.length), [500, 500, 201]);
    assert.deepEqual(result, { sent: 1201, failed: 0 });
    assert.deepEqual(calls.multicast[0].notification, { title: "T", body: "B" });
});

test("sendToMany clears only dead tokens", async () => {
    multicastImpl = async ({ tokens }) => ({
        successCount: 1,
        failureCount: 2,
        responses: [
            { success: true },
            { success: false, error: fcmError("messaging/invalid-registration-token") },
            { success: false, error: fcmError("messaging/internal-error") },
        ].slice(0, tokens.length),
    });
    const result = await sendToMany(["ok", "dead", "flaky"], "T", "B");
    assert.deepEqual(result, { sent: 1, failed: 2 });
    assert.deepEqual(calls.update[0].opts.where.fcm_token[Op.in], ["dead"]);
});

test("sendToMany counts a failed batch and continues", async () => {
    let n = 0;
    multicastImpl = async ({ tokens }) => {
        if (n++ === 0) throw new Error("network");
        return { successCount: tokens.length, failureCount: 0, responses: tokens.map(() => ({ success: true })) };
    };
    const tokens = Array.from({ length: 600 }, (_, i) => `t${i}`);
    assert.deepEqual(await sendToMany(tokens, "T", "B"), { sent: 100, failed: 500 });
});

test("sendToMany with no tokens does nothing", async () => {
    assert.deepEqual(await sendToMany([], "T", "B"), { sent: 0, failed: 0 });
    assert.equal(calls.multicast.length, 0);
});
