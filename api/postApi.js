const express = require('express');
const router = express.Router();
const { ROLES } = require('../utils/constants');
const authMiddleware = require('../middlewares/auth');
const { createNewPost, getPosts, getPostById, toggleLike, toggleDislike } = require('../controllers/postController');

class PostAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/create',
            authMiddleware(Object.values(ROLES)),
            createNewPost
        );
        this.router.get('/get', authMiddleware(Object.values(ROLES)), getPosts);
        this.router.get('/get/:id', getPostById);

        router.post('/:postId/like', authMiddleware(Object.values(ROLES)), toggleLike);
        router.post('/:postId/dislike', authMiddleware(Object.values(ROLES)), toggleDislike);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/post';
    }
}

module.exports = PostAPI;