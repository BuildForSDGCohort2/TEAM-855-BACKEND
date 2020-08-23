const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    confirmPassword: {
        type: String
    },
    country: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
});

module.exports = User = mongoose.model("users", UserSchema);