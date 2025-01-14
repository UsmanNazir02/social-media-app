const { Types } = require("mongoose");
const { getAllUsers, findUser } = require("../models/userModel");
const { generateResponse, asyncHandler } = require("../utils");
const { findFollowing, deleteFollowing, addFollowing, findFollowings } = require("../models/followingModel");


exports.getAllUsers = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = [
        {
            $match: {
                $and: [
                    { _id: { $ne: new Types.ObjectId(userId) } },
                    { isActive: true },
                    { isDeleted: false },
                    { username: { $regex: search, $options: 'i' } }
                ]
            }
        },
        {
            $lookup: {
                from: 'followings', // Your "followings" collection
                let: { userId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$following', '$$userId'] }, { $eq: ['$user', new Types.ObjectId(userId)] }] } } }
                ],
                as: 'isFollowed'
            }
        },
        {
            $addFields: {
                isFollowing: { $gt: [{ $size: '$isFollowed' }, 0] }
            }
        },
        { $sort: { createdAt: -1 } }
    ];

    const usersData = await getAllUsers({ query, page, limit });

    if (usersData?.users.length === 0) {
        generateResponse(null, 'No users found', res);
        return;
    }

    generateResponse(usersData, 'All users retrieved successfully', res);
});


exports.followUnFollowToggle = asyncHandler(async (req, res, next) => {
    const { following } = req.body;
    const user = req.user.id;

    if (!following || !Types.ObjectId.isValid(following)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide following properly.'
    });

    const userExist = await findUser({ _id: following });
    if (!userExist) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'User not found'
    });

    const followingExist = await findFollowing({ user, following });
    if (followingExist) {
        const deletedObj = await deleteFollowing({ user, following });
        if (deletedObj) {
            generateResponse(null, 'Un-followed successfully', res);
            return;
        }
    }

    const followingObj = await addFollowing({ user, following });

    generateResponse(followingObj, 'Follow successfully!', res);
});

exports.getUsersFollowing = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const followers = await findFollowings({ following: userId })
        .populate("user", "firstName lastName username ")
        .populate("following", "firstName lastName username ")

    if (!followers || followers.length === 0) {
        return generateResponse(null, "No followers found", res);
    }
    generateResponse(followers, "Followers retrieved successfully", res);
});