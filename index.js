const path = require('path');
try {
    const a = require("dotenv").config();
    if (a.error) throw a;
} catch (e) {
    console.log(e);
    require("dotenv").config({ path: path.join(__dirname, "../../.env") });
}
const express = require('express');
const API = require('./api');
const http = require("http");
const DB_CONNECT = require('./db/dbConnect');
const cookieSession = require('cookie-session');
const { notFound, errorHandler } = require('./middlewares/errorHandling');

const PORT = process.env.PORT || 5021;
const app = express();
DB_CONNECT();

const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'session',
    keys: [process.env.COOKIE_KEY],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}));

new API(app).registerGroups();
app.use(notFound);
app.use(errorHandler);

app.get('/', (req, res) => res.json({ message: `Welcome to the ${process.env.APP_NAME} Project` }));

httpServer.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
