const admin = require("firebase-admin");
const serviceAccount = require("../../../../rc-notification-52917-ef7aa38c6b18.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;