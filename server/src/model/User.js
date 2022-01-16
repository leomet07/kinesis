const mongoose = require("mongoose");

const userScheme = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		min: 4,
		max: 255,
	},
	email: {
		type: String,
		required: true,
		min: 6,
		max: 255,
	},
	password: {
		type: String,
		required: true,
		min: 6,
		max: 1024,
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
	hasCovid: {
		type: Boolean,
		default: false,
	},
});

const userModel = mongoose.model("User", userScheme);

module.exports = userModel;
