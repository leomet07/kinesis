const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
	x: {
		required: true,
		type: Number,
	},

	y: {
		required: true,
		type: Number,
	},

	current_occupied_user_id: {
		type: String,
	},
	occupied_since: {
		type: Date,
	},
});
const pointModelfordb = mongoose.model("point", pointSchema);

module.exports = pointModelfordb;
