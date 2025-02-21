// const admin = require("firebase-admin");
// const serviceAccount = require("../../../../rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;

const admin = require("firebase-admin");
const path = require("path");

// Build the absolute path to the key file
const keyPath = path.join(process.cwd(), "secrets", "rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");
const serviceAccount = require(keyPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
