const fs = require('fs');
const path = require('path');
// const { createPostValidation } = require('../validations/postValidation');
const { createPost, getPosts } = require('../models/postModel');
const { parseBody, generateResponse } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
const Joi = require('joi');

exports.createNewPost = async (req, res, next) => {
    try {
        console.log('Received request body:', req.body);
        console.log('Received files:', req.files);
        console.log('Headers:', req.headers);
        console.log('Files:', req.files);
        console.log('Body:', req.body);

        // Initialize body object
        const body = {
            title: req.body.title || null,
            text: req.body.text || null,
            user: req.user.id,
            media: null
        };

        // Handle file upload if present
        if (req.files && req.files.media) {
            const media = req.files.media;
            const fileName = `${Date.now()}-${media.name}`;
            const uploadDir = path.join(__dirname, '..', 'uploads');
            const uploadPath = path.join(uploadDir, fileName);

            // Create uploads directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Move the file
            await media.mv(uploadPath);
            body.media = `/uploads/${fileName}`;
        }

        console.log('Processed body:', body);

        // Create the post
        const post = await createPost(body);
        generateResponse(post, 'Post created successfully', res);

    } catch (error) {
        console.error('Error in createNewPost:', error);
        next({
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Failed to create post'
        });
    }
};

//getPost of current user
exports.getPosts = async (req, res, next) => {
    try {
        const posts = await getPosts({ user: req.user.id });
        generateResponse(posts, 'Posts fetched successfully', res);
    } catch (error) {
        console.error('Error in getPosts:', error);
        next({
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Failed to fetch posts'
        });
    }
};

// getPostByID?
exports.getPostById = async (req, res, next) => {
    try {
        const post = await getPosts({ _id: req.params.id });
        generateResponse(post, 'Post fetched successfully', res);
    } catch (error) {
        console.error('Error in getPostById:', error);
        next({
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Failed to fetch post'
        });
    }
};