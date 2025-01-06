const fs = require('fs');
const path = require('path');
// const { createPostValidation } = require('../validations/postValidation');
const { createPost, getPosts, findPost } = require('../models/postModel');
const { parseBody, generateResponse } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
const Joi = require('joi');
const { findFollowings } = require('../models/followingModel');


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
        const followingList = await findFollowings({ user: req.user.id }).select('following');
        const followingIds = followingList.map(f => f.following);

        const userIds = [...followingIds, req.user.id];

        const posts = await getPosts({ user: { $in: userIds } })
            .populate('user', 'username email')
            .sort({ createdAt: -1 });

        generateResponse(posts, 'Posts fetched successfully', res);
    } catch (error) {
        console.error('Error in getPosts:', error);
        next({
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Failed to fetch posts'
        });
    }
};

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

exports.toggleLike = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await findPost(postId);

        if (!post) {
            return next({
                statusCode: 404,
                message: 'Post not found',
            });
        }

        const hasLiked = post.likes && post.likes.includes(userId);

        if (hasLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
            post.likeCount -= 1;
        } else {
            post.likes = [...(post.likes || []), userId];
            post.likeCount += 1;
        }

        await post.save();
        generateResponse({ likeCount: post.likeCount }, hasLiked ? 'Post unliked successfully' : 'Post liked successfully', res);
    } catch (error) {
        console.error('Error in toggleLike:', error);
        next({
            statusCode: 500,
            message: error.message || 'Failed to toggle like',
        });
    }
};

exports.toggleDislike = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await findPost(postId);

        if (!post) {
            return next({
                statusCode: 404,
                message: 'Post not found',
            });
        }

        const hasDisliked = post.dislikes && post.dislikes.includes(userId);

        if (hasDisliked) {
            post.dislikes = post.dislikes.filter(id => id.toString() !== userId.toString());
            post.disLikeCount -= 1;
        } else {
            post.dislikes = [...(post.dislikes || []), userId];
            post.disLikeCount += 1;
        }

        await post.save();

        generateResponse({ disLikeCount: post.disLikeCount }, hasDisliked ? 'Post undisliked successfully' : 'Post disliked successfully', res);

    } catch (error) {
        console.error('Error in toggleDislike:', error);
        next({
            statusCode: 500,
            message: error.message || 'Failed to toggle dislike',
        });
    }
};

