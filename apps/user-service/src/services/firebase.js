const admin = require("firebase-admin");
const serviceAccount = require("../../../../rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;