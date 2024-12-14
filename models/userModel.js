const { Schema, model } = require('mongoose');
const { ROLES } = require('../utils/constants');

const userSchema = new Schema({
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    username: { type: String, default: "" },
    email: { type: String, lowercase: true, default: null },
    password: { type: String, select: false, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    role: { type: String, enum: Object.values(ROLES) },
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
}, { timestamps: true, versionKey: false });

// compile model from schema
const UserModel = model('User', userSchema);

// create new user
exports.createUser = (obj) => UserModel.create(obj);

// find user by query
exports.findUser = (query) => UserModel.findOne({ ...query, isDeleted: false });

// update user
exports.updateUser = (query, obj) => UserModel.findOneAndUpdate(query, obj, { new: true });