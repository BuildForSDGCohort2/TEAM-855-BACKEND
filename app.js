const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const path = require("path");
const passport = require("passport");
const { PORT, MONGO_URI } = require("./config/keys")

// init app
const app = express();

// add Helmet to enhance Api security
app.use(helmet());

/**
 * middlewares
 */
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// setup static directory
app.use(express.static(path.join(__dirname, 'public')));

// Use passport middleware
app.use(passport.initialize());
// Bring in passport strategy 
require("./config/passport")(passport);

// config and connect mongodb
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log(`Database connected successfully to ${MONGO_URI} 🚀`)
}).catch((err) => {
    console.log(`Unable to connect to the database ${err} 🚩`);
});

/**
 * routes
 */
app.get("/", (req, res) => {
    res.send(`Server running on port ${PORT}`)
});

// bring in user api route
const users = require("./routes/users");
app.use("/api/users", users);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});