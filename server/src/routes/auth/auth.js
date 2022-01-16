const router = require("express").Router();
const User = require("../../model/User");
const { registerValidation, loginValidation } = require("../../validation");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.get("/", (req, res) => {
	res.json({ message: "auth index" });
});
router.post("/register", async (req, res, next) => {
	try {
		const validation = registerValidation(req.body);
		if ("error" in validation) {
			res.status(400);
			throw new Error(validation.error.details[0].message);
		}

		// Check if email exists in db
		const emailExist = await User.findOne({
			email: req.body.email,
		});

		if (emailExist) {
			res.status(405);
			throw new Error("Email already exists!");
		}

		// Hash the password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(req.body.password, salt);

		const user = new User({
			name: req.body.name,
			email: req.body.email,
			password: hashedPassword,
		});
		let savedUser = await user.save();

		// create and assaign a jwt
		console.log(process.env.ACCESS_TOKEN_SECRET);
		const token = jwt.sign(
			{
				_id: savedUser._id,
			},
			process.env.ACCESS_TOKEN_SECRET
		);
		res.status(200);
		res.header("auth-token", token).send({
			token: token,
			logged_in: true,
			uid: savedUser._id,
		});
	} catch (error) {
		next(error);
	}
});

// LOGIN

router.post("/login", async (req, res, next) => {
	try {
		const validation = loginValidation(req.body);
		if ("error" in validation) {
			res.status(400);
			throw new Error(validation.error.details[0].message);
		}

		// Check if email exists in db
		const user = await User.findOne({
			email: req.body.email,
		});

		if (!user) {
			res.status(404);
			throw new Error("User doesn't exist.");
		}

		// check password status

		const valid_pass = await bcrypt.compare(
			req.body.password,
			user.password
		);

		if (!valid_pass) {
			res.status(400);
			throw new Error("Invalid password.");
		}

		// create and assaign a jwt
		const token = jwt.sign(
			{
				_id: user._id,
			},
			process.env.ACCESS_TOKEN_SECRET
		);
		res.status(200);
		res.header("auth-token", token).json({
			token: token,
			logged_in: true,
			uid: user._id,
			is_admin: user.isAdmin,
			isApproved: user.isApproved,
		});
	} catch (error) {
		next(error);
	}
});

router.get("/verify/:id", async (req, res, next) => {
	try {
		let token = req.params.id;
		const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		console.log(verified);
		const uid = verified._id;

		const user = await User.findById(uid);
		if (!user) {
			res.status(404);
			throw new Error("User with that token doesn't exist.");
		}
		res.status(200);
		res.json({
			valid: true,
			isAdmin: user.isAdmin,
			uid: uid,
			isApproved: user.isApproved,
			user: user,
		});
	} catch (error) {
		next(error);
	}
});

module.exports = {
	router: router,
};
