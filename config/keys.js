const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    SECRET: process.env.SECRET,
    FRONTEND_URI: process.env.FRONTEND_URI
};