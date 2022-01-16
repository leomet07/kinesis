# Kinesis (working title) Server
Kinesis is a seat reservation and contact tracing system written for StuyHacks XI.
We use an [Express](https://expressjs.com/) API with a [Helmet](https://www.npmjs.com/package/helmet) middleware with [morgan](https://www.npmjs.com/package/morgan) logging.
For the database, we use [MongoDB](https://www.mongodb.com/) via the [Mongoose](https://www.npmjs.com/package/mongoose) interface.


## Quickstart
### _.env_ specifications

`MONGODB_URI` is the connection uri to mongodb

`PORT` is the port to run the server on

`ACCESS_TOKEN_SECRET` is the encryption private key used to create and verify json web tokens.

`GOOGLE_CLIENTID` is the Client ID code of your Google OAuth Application.

`GOOGLE_CLIENT_SECRET` is the Client Secret of the
Google OAuth Application.
`GOOGLE_REF_TOKEN` is the refresh token (with Gmail scopes) for the Google user account you are sending emails from.

### Running

```
npm i
npm run dev
```
