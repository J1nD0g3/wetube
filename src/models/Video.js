import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    videoURL: {type: String},
    title: { type: String, required: true, trim: true, maxLength: 80},
    description: { type: String, required: true, trim: true, minLength: 20},
    createdAt: {type: Date, required: true, default: Date.now},
    hashtags: [{type: String, required: true, trim: true} ],
    meta:{
        views: {type: Number, default: 0},
        rating: {type: Number, default: 0},
    },
    owner: {type: mongoose.Schema.Types.ObjectID, required: true, ref: "User"},
})

videoSchema.static("formatHashtag", function (hashtags) {
    return hashtags
        .split(',')
        .map((word) => word.startsWith('#') ? word : `#${word}`);
});

const Video = mongoose.model("Video", videoSchema);
export default Video;