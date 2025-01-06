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
const cors = require('cors');
const fileUpload = require('express-fileupload');

const PORT = process.env.PORT || 5021;
const app = express();
DB_CONNECT();

const httpServer = http.createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp'),
    createParentPath: true,
    parseNested: true,
    debug: true,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
    uploadTimeout: 60000, // 1 minute timeout
    // Add this debug function
    debug: function (debugText) {
        console.log('File Upload Debug:', debugText);
    }
}));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:8081', 'http://localhost:19006'], // Add your Expo web port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
