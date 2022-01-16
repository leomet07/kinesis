const verifyTokenMiddlware = require("../auth/verifyTokenMiddleware");
const isAdminMiddleware = require("../auth/isAdminMiddleware");
const router = require("express").Router();
const Point = require("../../model/Point");
const Stay = require("../../model/Stay");
const User = require("../../model/User");
const sendMail = require("../../emails/index");

router.use(verifyTokenMiddlware);
// Base route
router.get("/", async (req, res) => {
	res.json({ message: "Index for db" });
});

// Get all points in DB
router.get("/get_points", get_points_handler);
router.post("/get_points", get_points_handler);
async function get_points(query) {
	let points = await Point.find(query);
	return points;
}
async function get_points_handler(req, res, next) {
	try {
		const points = await get_points(req.body || {});
		res.json({
			points: points,
			description: "Successfully retrieved points.",
		});
	} catch (error) {
		next(error);
	}
}

// create seating point in DB
// POST body: {"x": Number, "y": Number}
router.post("/create_point", async (req, res, next) => {
	try {
		const saved_point = await create_point(req.body, req.user_id);
		res.json({
			point: saved_point,
			description: "Successfully created.",
		});
	} catch (error) {
		next(error);
	}
});

// set seating point occupied/unoccupied
// POST body: {"point_id": DB _id}
router.post("/occupy_point", async (req, res, next) => {
	try {
		const point_id = req.body.point_id;
		const user_id = req.user._id;
		console.log({ user_id, point_id });

		// Check if user is already occupying a seat
		const occupied_points = await get_points({
			current_occupied_user_id: user_id,
		});
		console.log(occupied_points);
		if (occupied_points.length > 0) {
			throw new Error("A point is already occupied");
		}

		const point = await Point.findById(point_id);

		if (point.current_occupied_user_id) {
			res.status(403);
			throw new Error("Point is already occupied");
		}
		const now = Date.now();
		const toUpdate = {
			current_occupied_user_id: user_id,
			occupied_since: now,
		};
		let newPoint = (
			await Point.findByIdAndUpdate(point_id, toUpdate, {
				upsert: false,
			})
		).toObject();

		newPoint = { ...newPoint, ...toUpdate };

		res.json({ success: true, updated: newPoint });
		res.status(200);
	} catch (error) {
		next(error);
	}
});
router.post("/unoccupy_point", async (req, res, next) => {
	try {
		const point_id = req.body.point_id;
		const user_id = req.user._id;

		const point = await Point.findById(point_id);

		if (!point.current_occupied_user_id) {
			res.status(403);
			throw new Error("Can't unoccupy an unoccupied point");
		}

		if (point.current_occupied_user_id != user_id) {
			res.status(403);
			throw new Error("Can't unoccupy someone elses point");
		}

		const toUpdate = {
			current_occupied_user_id: null,
			occupied_since: null,
		};
		let newPoint = (
			await Point.findByIdAndUpdate(point_id, toUpdate, {
				upsert: false,
			})
		).toObject();

		newPoint = { ...newPoint, ...toUpdate };
		// ADD to history collection (of the visit) (with current timestamp)
		const current_time = Date.now();
		const proposedstay = await Stay.create({
			point: point_id,
			user_id: user_id,
			start: point.occupied_since,
			end: current_time,
		});
		const newStay = await proposedstay.save();

		res.json({ success: true, updated: newPoint, stay: newStay });
	} catch (error) {
		next(error);
	}
});

// get distance between two points
// POST body: {"p1": DB _id, "p2": DB _id}
router.get("/point_dist", async (req, res, next) => {
	try {
		const p1 = await Point.findOne({
			_id: req.body.p1,
		});

		if (!p1) {
			res.status = 404;
			throw new Error("Point 1 doesn't exist");
		}

		const p2 = await Point.findOne({
			_id: req.body.p2,
		});

		if (!p2) {
			res.status = 404;
			throw new Error("Point 2 doesn't exist");
		}
		const dist = get_dist_ft(p1, p2);
		res.json({
			distance: dist,
			description: "Successfully calculated.",
		});
		res.status = 200;
	} catch (error) {
		next(error);
	}
});

router.post("/change_covid_status", async (req, res, next) => {
	try {
		// Oh no :(
		const covid_status = req.body.covid_status;
		const updatedUser = await User.findByIdAndUpdate(req.user._id, {
			hasCovid: covid_status,
		});
		updatedUser.hasCovid = covid_status;
		if (updatedUser.hasCovid) {
			await handlePositiveCovid(req.user);
		}
		return res.json({ updated_user: updatedUser });
	} catch (error) {
		next(error);
	}
});

async function handlePositiveCovid(user) {
	console.log("User in handlePositiveCovid", user);
	const stays = await Stay.find({}).populate("point");

	const userstays = [];
	const otherstays = [];
	for (let s of stays) {
		if (s.user_id == user._id) {
			userstays.push(s);
		} else {
			otherstays.push(s);
		}
	}

	const exposure_map = {};
	for (const userstay of userstays) {
		for (const otherstay of otherstays) {
			if (
				userstay.start <= otherstay.start &&
				userstay.end >= otherstay.end
			) {
				const p1 = userstay.point;
				const p2 = otherstay.point;

				const dist = get_dist_ft(p1, p2);

				// console.log("Exposure, ", { userstay, otherstay });
				console.log("Dist in ft: ", dist);
				if (exposure_map[otherstay["user_id"]]) {
					exposure_map[otherstay["user_id"]].push({
						dist_feet: dist,
						time: otherstay.start,
					});
				} else {
					exposure_map[otherstay["user_id"]] = [
						{ dist_feet: dist, time: otherstay.start },
					];
				}
			}
		}
	}
	console.log("exposure_map", exposure_map);
	for (uid in exposure_map) {
		let user = await User.findById(uid);
		console.log("Looked up user", user);
		let text = "";
		if (exposure_map[uid].length > 1) {
			text =
				"You have potentially been exposed to COVID-19 multiple times at our establishment: <ol>";
			for (let i = 0; i < exposure_map[uid].length; i++) {
				text += `<li> ${exposure_map[uid][
					i
				].time.toDateString()} ${exposure_map[uid][
					i
				].time.toTimeString()} at a distance of ${exposure_map[uid][
					i
				].dist_feet.toFixed(2)} </li>`;
			}
			text += "</ol>";
		} else {
			const date_str = exposure_map[uid][0].time.toDateString();
			text = `You have potentially been exposed to COVID-19 on your visit to our establishment on ${date_str} at a distance of ${exposure_map[
				uid
			][0].dist_feet.toFixed(2)} feet.`;
		}
		text +=
			'\nPlease follow <a href="https://www.cdc.gov/coronavirus/2019-ncov/your-health/quarantine-isolation.html">CDC guidance</a> on the appropriate measures to take after exposure.';

		// Message strings only do first exposure
		const emailParams = {
			from: "Kinesis App <kinesis.stuyhacks@gmail.com>",
			to: user.email,
			subject: "Potential COVID Exposure",
			html: text,
		};
		console.log("emailParams: ", emailParams);
		await sendMail(emailParams);

		// console.log(user); // TODO: contact this user
	}
}
// calculate distance in feet between points using the pythagorean theorem
// with a ratio of 40 pixels to 1 foot
function get_dist_ft(p1, p2) {
	const xdiff = Math.abs(p1.x - p2.x);
	const ydiff = Math.abs(p1.y - p2.y);
	const diff = Math.sqrt(xdiff ** 2 + ydiff ** 2) / 40;
	return diff;
}
async function create_point(query) {
	let point = await Point.create({ ...query });
	let saved_point = await point.save();
	return saved_point;
}

module.exports.router = router;
