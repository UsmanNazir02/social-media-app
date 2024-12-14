const router = require('express').Router();
const {
    register,
    login,
    logout,
    sendVerificationCode,
    verifyCode,
    resetPassword,
    getRefreshToken } = require('../controllers/authController');
const { ROLES } = require('../utils/constants');
const authMiddleware = require('../middlewares/auth')

class AuthAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;

        router.post('/register', register);
        router.post('/login', login);
        router.post('/logout', authMiddleware(Object.values(ROLES)), logout);

        router.post('/send-code', sendVerificationCode);
        router.put('/verify-code', verifyCode);
        router.put('/reset-password', authMiddleware(Object.values(ROLES)), resetPassword);
        router.put('/refresh-token', getRefreshToken);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/auth';
    }
}

module.exports = AuthAPI;