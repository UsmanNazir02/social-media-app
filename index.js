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


const PORT = process.env.PORT || 5021;
const app = express();
DB_CONNECT();

const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ message: `Welcome to the ${process.env.APP_NAME} Project` }));

httpServer.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
