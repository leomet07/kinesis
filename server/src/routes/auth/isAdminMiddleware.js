module.exports = async function (req, res, next) {
	try {
		if (req.user.isAdmin) {
			next();
		} else {
			throw new Error("User is not an admin.");
		}
	} catch (error) {
		next(error);
	}
};
