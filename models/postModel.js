const { Schema, model } = require("mongoose");

const postSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: null },
    text: { type: String, default: null },
    media: { type: String, default: null },
    likes: { type: [{ type: Schema.Types.ObjectId, ref: 'User', }], default: [] },
    dislikes: { type: [{ type: Schema.Types.ObjectId, ref: 'User', }], default: [] },
    likeCount: { type: Number, default: 0 },
    disLikeCount: { type: Number, default: 0 },
}, { timestamps: true });


const PostModel = model("Post", postSchema);

// create new post
exports.createPost = (obj) => PostModel.create(obj);

exports.getPosts = (query) => PostModel.find(query);

//findById
exports.findPost = (id) => PostModel.findById(id);