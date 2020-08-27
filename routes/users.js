const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { SECRET } = require("../config/keys");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// config nodemailer transport

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: process.env.EMAIL_SMTP_PORT,
    // secure: process.env.EMAIL_SMTP_SECURE, // lack of ssl commented this. You can uncomment it.
    auth: {
        user: process.env.EMAIL_SMTP_USERNAME,
        pass: process.env.EMAIL_SMTP_PASSWORD
    }
});

/**
 * @route api/users/register-business
 * @description register business
 */

router.post("/register", [
    // validate first name
    check("firstName")
    .isLength({ max: 20, min: 2 }).withMessage("First name must be between 2 - 20 characters")
    .not().notEmpty().withMessage("First name is required"),
    // validate last name
    check("lastName")
    .isLength({ min: 2, max: 20 }).withMessage("Last name must be between 2 - 20 characters")
    .not().notEmpty().withMessage("Last name is required"),
    // validate phone number
    check("phoneNumber")
    .isLength({ max: 10, min: 10 }).withMessage("Phone number must be 10 digits")
    .not().isEmpty().withMessage("Phone number is required"),
    // validate email
    check("email", "Please enter a valid email address")
    .normalizeEmail()
    .isEmail(),
    // validate country
    check("address")
    .not().isEmpty().withMessage("Address is required"),
    //valiate password
    check(
        "password",
        "Please enter a password at least 8 character and contain At least one uppercase.At least one lower case.At least one special character. ",
    )
    .isLength({ min: 8 })
    .matches(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/,
    ),
    // check if password = confirm password
    check('confirmPassword', 'Passwords do not match').custom((value, { req }) => (value === req.body.password)),
    // check if email is already taken
    check('email').custom(value => {
        return User.findOne({ email: value }).then(user => {
            if (user) {
                return Promise.reject("Email is already taken");
            }
        });
    })
], (req, res) => {
    // return validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
            success: false
        });
    }
    let {
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        address
    } = req.body;
    // if all inputs are valid
    let newUser = new User({
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        address,
        emailToken: crypto.randomBytes(64).toString("hex")
    });
    // hash password
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
                throw err
            };
            newUser.password = hash;
            newUser.save().then((user) => {
                // email object
                const message = {
                    from: "hello@khabubundivhu.co.za",
                    to: user.email,
                    subject: "Kulisha - Verify your account",
                    html: `
                        <h1>Hi ${user.lastName} ${user.firstName}</h1>
                        <p>Thank you for creating an account on Kulisha</p>
                        <p>Pleas click the link below to verify your account</p>
                        <a href="https://localhost:8000/verify-account/${user.emailToken}">Verify account</a>
                    `
                };
                transporter.sendMail(message, function(error, info) {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log("Email sent", info.response);
                    }
                });
                return res.status(201).json({
                    msg: "User was successfully created",
                    success: true,
                    data: user
                });
            })
        })
    })
});

/**
 * @route POST api/users/login
 * @desc Login route
 * @access Public
 */

router.post("/login", [
    check("email").notEmpty(),
    check("password").notEmpty(),

], (req, res) => {
    let {
        email,
        password
    } = req.body;
    User.findOne({ email: email }).then((user) => {
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }
        // If user is found, compare passwords
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    location: user.location,
                };
                jwt.sign(payload, SECRET, { expiresIn: 604800 }, (err, token) => {
                    res.status(200).json({
                        success: true,
                        user: user,
                        token: `Bearer ${token}`,
                        msg: "User successfully logged in"
                    })
                });
            } else {
                return res.status(404).json({
                    msg: "Incorrect password. Did you forget your password?",
                    success: false,
                });
            }
        });
    });
});

/**
 * @route POST api/users/profile
 * @desc Get logged in user profile
 * @access Private
 */

router.get("/profile", passport.authenticate("jwt", { session: false }), (req, res) => {
    return res.json({
        user: req.user
    })
})

module.exports = router;