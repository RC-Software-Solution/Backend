// const admin = require("firebase-admin");

// if(!admin.apps.length){
//     const serviceAccount = require("../../../../secrets/rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//     });
// }

// const sendPushNotification = async (fcm_token, title, message) => {
//     try {
//         const messagePayload = {
//             notification: { title, body: message },
//             token: fcm_token,
//         };
//         await admin.messaging().send(messagePayload);
//     } catch (error) {
//         console.log("error sending push notification",error);
//         throw error;
//     }
// }

// module.exports = { sendPushNotification };

const admin = require("firebase-admin");
const path = require("path");

if (!admin.apps.length) {
    // Build the absolute path: process.cwd() returns /app if your working directory is set there
    const keyPath = path.join(process.cwd(), "secrets", "rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");
    const serviceAccount = require(keyPath);
    
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
        console.log("error sending push notification", error);
        throw error;
    }
}

module.exports = { sendPushNotification };
