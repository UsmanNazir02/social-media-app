const { Schema, model } = require("mongoose");
const { findUser } = require("./userModel");


const followingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    following: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, versionKey: false });

const FollowingModel = model('Following', followingSchema);

// add follower
exports.addFollowing = (obj) => FollowingModel.create(obj);

exports.findFollowing = (query) => FollowingModel.findOne(query);

// delete follower
exports.deleteFollowing = (query) => FollowingModel.deleteOne(query);

// find
exports.findFollowings = (query) => FollowingModel.find(query);