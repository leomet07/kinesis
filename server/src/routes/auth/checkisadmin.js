const User = require("../../model/User");
module.exports = async function (uid) {
	const user = await User.findById(uid);
	return user.isAdmin;
};
