const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrganisationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String
    },
    organistionType: {
        type: String,
        enum: ["nonprofit", "farm", "supermarket", "food_manufacturer", "admin"]
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    address: {
        type: String
    },
    active: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = Organisation = mongoose.model("organisations", OrganisationSchema);