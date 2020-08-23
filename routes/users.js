const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { SECRET, SENDGRID_API_KEY } = require("../config/keys");
const User = require("../models/User");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);
const crypto = require("crypto");

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
    check("country")
    .not().isEmpty().withMessage("Country is required"),
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
                return Promise.reject('Email is already taken');
            }
        });
    })
], (req, res) => {
    // return validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array());
    }
    let {
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        country
    } = req.body;
    // if all inputs are valid
    let newUser = new User({
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        country,
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
                    from: "khabubundivhu@gmail.com",
                    to: user.email,
                    subject: "Kulisha - Verify your account",
                    text: `
                        Hi thank you for creating an account on Kulisha.
                        please click the link below to verify your account. 
                        <a href="https//localhost:8000/verify-account/${user.emailToken}">Verify account</a>
                    `,
                    html: `
                        <h1>Hi</h1>
                        <p>Thank you for creating an account on Kulisha</p>
                        <p>Pleas click the link below to verify your account</p>
                        <a href="https://localhost:8000/verify-account/${user.emailToken}">Verify account</a>
                    `
                };
                sgMail.send(message).then(() => {
                    console.log('Message sent')
                }).catch((error) => {
                    console.log(error.response.body)
                        // console.log(error.response.body.errors[0].message)
                })
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

router.post("/login", (req, res) => {
    User.findOne({ email: req.body.email }).then((user) => {
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }
        // If user is found, compare passwords
        bcrypt.compare(req.body.password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    businessName: user.businessName,
                    businessTelephone: user.businessTelephone,
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