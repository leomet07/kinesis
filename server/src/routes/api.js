const router = require("express").Router();
const dbRouter = require("./db/db").router;
const apiRouter = require("./auth/auth").router;

router.get("/", (req, res) => {
	res.json({ message: "Hello world from /api." });
});
router.use("/db", dbRouter);
router.use("/auth", apiRouter);

module.exports.router = router;
