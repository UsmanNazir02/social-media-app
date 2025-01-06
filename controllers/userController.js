const { Types } = require("mongoose");
const { getAllUsers, findUser } = require("../models/userModel");
const { generateResponse, asyncHandler } = require("../utils");
const { findFollowing, deleteFollowing, addFollowing } = require("../models/followingModel");


exports.getAllUsers = asyncHandler(async (req, res) => {
    const user = req.user.id;
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = [
        {
            $match: {
                $and: [
                    { _id: { $ne: Types.ObjectId.createFromTime(user) } },
                    { isActive: true },
                    { isDeleted: false },
                    { username: { $regex: search, $options: 'i' } }
                ]
            }
        },
        { $sort: { createdAt: -1 } }
    ]

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