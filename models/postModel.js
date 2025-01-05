const { Schema, model } = require("mongoose");

const postSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: null },
    text: { type: String, default: null },
    media: { type: String, default: null },

}, { timestamps: true });


const PostModel = model("Post", postSchema);

// create new post
exports.createPost = (obj) => PostModel.create(obj);

exports.getPosts = (query) => PostModel.find(query);