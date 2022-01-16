const jwt = require("jsonwebtoken");
const User = require("../../model/User");
module.exports = async function (req, res, next) {
	try {
		const token = req.header("auth-token");
		if (!token) {
			throw new Error("Token not included");
		}
		// console.log("verify token middleware says token: ", token);
		// console.log("type of token: ", typeof token);
		// console.log("jwt secret: ", process.env.ACCESS_TOKEN_SECRET);
		const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		const fromDB = await User.findById(verified._id);

		if (!fromDB) {
			throw new Error("The user doesn't exist");
		}
		req.user = fromDB;
		next();
	} catch (error) {
		next(error);
	}
};
