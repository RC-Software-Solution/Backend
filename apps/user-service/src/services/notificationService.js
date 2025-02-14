const admin = require("firebase-admin");

if(!admin.apps.length){
    const serviceAccount = require("../../../../rc-notification-52917-ef7aa38c6b18.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const sendPushNotification = async (fcm_token, title, message) => {
    try {
        const messagePayload = {
            notification: { title, body: message },
            token: fcm_token,
        };
        await admin.messaging().send(messagePayload);
    } catch (error) {
        console.log("error sending push notification",error);
        throw error;
    }
}

module.exports = { sendPushNotification };