const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
// assuming dotenv is already activated

const createTransporter = async () => {
	const oauth2Client = new OAuth2(
		process.env.GOOGLE_CLIENTID,
		process.env.GOOGLE_CLIENT_SECRET,
		"https://developers.google.com/oauthplayground"
	);

	oauth2Client.setCredentials({
		refresh_token: process.env.GOOGLE_REF_TOKEN,
	});

	const accessToken = await new Promise((resolve, reject) => {
		oauth2Client.getAccessToken((err, token) => {
			if (err) {
				reject("Failed to obtain access token");
			}
			resolve(token);
		});
	});

	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "kinesis.stuyhacks@gmail.com",
			accessToken,
			clientId: process.env.GOOGLE_CLIENTID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			refreshToken: process.env.GOOGLE_REF_TOKEN,
		},
	});

	return transporter;
};

async function sendMail(args) {
	let transporter = await createTransporter();
	transporter.sendMail(args);
}

module.exports = sendMail;
