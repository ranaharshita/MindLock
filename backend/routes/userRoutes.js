const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");


// --------------------
// SIGNUP
// --------------------
router.post("/signup", async (req, res) => {

    try {

        const { username, password } = req.body;


        if (!username || !password) {
            return res.json({
                success: false,
                message: "Please fill all fields."
            });
        }


        const existingUser = await User.findOne({ username });


        if (existingUser) {
            console.log("User already exists");
            return res.json({
                success: false,
                message: "Username already exists."
            });
        }

        

        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();


        res.json({
            success: true,
            message: "Signup successful."
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false,
            message: "Server Error"
        });

    }

});

// --------------------
// LOGIN
// --------------------
router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.json({
                success: false,
                message: "Username not found."
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.json({
                success: false,
                message: "Wrong password."
            });
        }

        res.json({
            success: true,
            message: "Login successful.",
            username: user.username
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false,
            message: "Server Error"
        });

    }

});

// --------------------
// LOGOUT
// --------------------
// NOTE: This backend does not issue sessions or JWT tokens (login only
// returns a success/failure message), so there is nothing server-side to
// invalidate yet. This route exists so the frontend can call a real
// endpoint on logout instead of only clearing local state. If you add
// token-based auth later, this is where you'd blacklist/expire the token.
router.post("/logout", (req, res) => {
    res.json({
        success: true,
        message: "Logout successful."
    });
});

module.exports = router;