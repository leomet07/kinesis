const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const morgan = require("morgan");
const dotenv = require("dotenv").config();
const middlewares = require("./middlewares");
const fileUpload = require("express-fileupload");
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(
	fileUpload({
		createParentPath: true,
	})
);
app.use(helmet());
app.use(morgan("tiny"));

const db_str = process.env.MONGODB_URI;
console.log(db_str);
mongoose.connect(
	db_str,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	() => {
		console.log("connected to db!");
	}
);

// import Routes
const apiRouter = require("./routes/api").router;

//Routes Middleware
app.use("/api/", apiRouter);
app.get("/", function (req, res) {
	res.send("Hello World to the backend");
});

// Configure a middleware for 404s and the error handler
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const port = process.env.PORT || 4444;
app.listen(port, () => {
	console.log("Sever is up and running at http://127.0.0.1:" + port);
});
