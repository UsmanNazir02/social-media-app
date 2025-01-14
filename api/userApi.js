const router = require('express').Router();
const { ROLES } = require('../utils/constants');
const authMiddleware = require('../middlewares/auth');
const { getAllUsers, followUnFollowToggle, getUsersFollowing } = require('../controllers/userController');

class UserAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.get('/', authMiddleware(Object.values(ROLES)), getAllUsers);
        router.get('/following', authMiddleware([ROLES.USER]), getUsersFollowing);

        router.post('/follow-toggle', authMiddleware([ROLES.USER]), followUnFollowToggle);

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = UserAPI;