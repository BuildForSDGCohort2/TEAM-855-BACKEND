const express = require("express");
const router = express.Router();
const Organisation = require("../models/Organisation");
const passport = require("passport");
const User = require("../models/User");
const { check, validationResult } = require("express-validator");
const { route } = require("./users");

/**
 * @route POST api/organisations/register
 * @desc Register an oragnisation
 * @access private
 */
router.post("/register", [
        check("name")
        .notEmpty()
        .withMessage("Organisation name is required"),

        check("organisationType")
        .notEmpty()
        .withMessage("Organisation type is required"),

        check("email")
        .notEmpty()
        .withMessage("Organisation email is required"),

        check("phoneNumber")
        .notEmpty()
        .withMessage("Organisation contact number is required"),

        check("address")
        .notEmpty()
        .withMessage("Organisation address is required"),

    ],
    passport.authenticate("jwt", { session: false }), (req, res) => {
        // return validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                success: false,
            });
        }
        let {
            userId,
            name,
            organistionType,
            email,
            phoneNumber,
            address
        } = req.body
        User.findById({ _id: req.user._id }).then((user) => {
            if (!user) {
                res.status(400).json({
                    msg: "User was not found",
                    success: false
                })
            } else if (!user.isVerified) {
                res.status(400).json({
                    msg: "Please verify your account to procced",
                    success: false
                })
            }

            let newOrganisation = new Organisation({
                userId: user._id,
                name,
                organistionType,
                email,
                phoneNumber,
                address
            });

            newOrganisation.save().then((organisation) => {
                res.status(201).json({
                    msg: "Organisation was successfully created",
                    organisation
                })
            })
        })
    });

/**
 * @route GET api/organisations/my-organisations
 * @desc Get current user's organisations
 * @access private
 */
router.get("/my-organisations", passport.authenticate("jwt", { session: false }), (req, res) => {
    User.findById({ _id: req.user._id }).then((user) => {
        if (!user) {
            res.status(400).json({
                msg: "User was not found",
                success: false
            })
        } else if (!user.isVerified) {
            res.status(400).json({
                msg: "Please verify your account to procced",
                success: false
            })
        }
        Organisation.find().where({ userId: user._id }).then((organisations) => {
            res.status(200).json({
                organisations,
                msg: "Organisations retrieved",
                success: true
            })
        })
    })
});

/**
 * @route GET api/organisations/organisation/:id
 * @desc Get organisation by id
 * @access private
 */
router.get("/organisation/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
    let id = req.params.id;
    let userId = req.user._id;
    // find organisation by id where userId is current loggedIn userId
    Organisation.findById(id).where({ userId: userId }).then((organisation) => {
        // if organisation is null return status 500
        if (!organisation) {
            res.status(500).json({
                msg: "Organisation was not found",
                success: false
            })
        }
        // if not return status 200 with organisation object
        res.status(200).json({
            organisation,
            success: true
        })
    })
});


module.exports = router;