const mongoose = require("mongoose");

const staySchema = new mongoose.Schema({
	point: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "point",
		required: true,
	},
	user_id: {
		required: true,
		type: String,
	},
	start: {
		required: true,
		type: Date,
	},
	end: {
		required: true,
		type: Date,
	},
	covid: {
		type: Boolean,
		default: false,
	},
});
const stayModelfordb = mongoose.model("stay", staySchema);

module.exports = stayModelfordb;
