const bycrypt = require("bcryptjs");

const hashPassword = async(password) => await bycrypt.hash(password, 10);
const comparePassword = async(password, hash) => await bycrypt.compare(password, hash);

module.exports = { hashPassword, comparePassword };