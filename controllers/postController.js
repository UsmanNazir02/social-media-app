const fs = require('fs');
const path = require('path');
// const { createPostValidation } = require('../validations/postValidation');
const { createPost, getPosts } = require('../models/postModel');
const { parseBody, generateResponse } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
const Joi = require('joi');


exports.createNewPost = async (req, res, next) => {
    try {
        const body = {
            title: req.body.title,
            text: req.body.text,
            user: req.user.id,
            media: null
        };

        if (req.files && req.files.media) {
            const file = req.files.media;

            // Additional validation
            if (!file.mimetype.startsWith('image/')) {
                return next({
                    statusCode: STATUS_CODES.BAD_REQUEST,
                    message: 'Only image files are allowed'
                });
            }

            const fileExt = path.extname(file.name).toLowerCase();
            const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
            const uploadDir = path.join(__dirname, '..', 'uploads');
            const uploadPath = path.join(uploadDir, uniqueName);

            // Ensure upload directory exists
            await fs.promises.mkdir(uploadDir, { recursive: true });

            try {
                // Move the file
                await file.mv(uploadPath);
                body.media = `/uploads/${uniqueName}`;
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                return next({
                    statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
                    message: `File upload failed: ${uploadError.message}`
                });
            }
        }

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
        const posts = await getPosts({ user: req.user.id }).populate('user', 'username email');
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