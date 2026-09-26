const admin = require("firebase-admin");
const path = require("path");
const { Op } = require("sequelize");
const User = require("../models/User");

const FCM_BATCH_LIMIT = 500;
const DEAD_TOKEN_CODES = new Set([
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
]);

let messaging;
function getMessaging() {
    if (!messaging) {
        if (!admin.apps.length) {
            // process.cwd() is /app inside the container
            const keyPath = path.join(process.cwd(), "secrets", "rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");
            admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
        }
        messaging = admin.messaging();
    }
    return messaging;
}

async function clearTokens(tokens) {
    if (!tokens.length) return;
    try {
        await User.update({ fcm_token: null }, { where: { fcm_token: { [Op.in]: tokens } } });
    } catch (error) {
        console.log("error clearing dead fcm tokens", error);
    }
}

// Never throws: callers have usually already committed a DB change.
const sendPushNotification = async (fcm_token, title, message) => {
    try {
        await getMessaging().send({ notification: { title, body: message }, token: fcm_token });
        return true;
    } catch (error) {
        console.log("error sending push notification", error);
        if (DEAD_TOKEN_CODES.has(error.code)) await clearTokens([fcm_token]);
        return false;
    }
};

const sendToMany = async (tokens, title, message) => {
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < tokens.length; i += FCM_BATCH_LIMIT) {
        const batch = tokens.slice(i, i + FCM_BATCH_LIMIT);
        try {
            const res = await getMessaging().sendEachForMulticast({ notification: { title, body: message }, tokens: batch });
            sent += res.successCount;
            failed += res.failureCount;
            await clearTokens(batch.filter((_, j) => DEAD_TOKEN_CODES.has(res.responses[j].error?.code)));
        } catch (error) {
            console.log("error sending multicast batch", error);
            failed += batch.length;
        }
    }
    return { sent, failed };
};

module.exports = { sendPushNotification, sendToMany };
