import Video from "../models/Video";
import User from "../models/User";

export const home = async(req, res) => {
    try{    
        const videos = await Video.find({}).sort({createdAt : "desc"});
        return res.render("home", {pageTitle: "Home", videos});
    }
    catch{
        return res.render("server-error");
    }

};

export const watch = async(req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id).populate('owner');
    console.log(video);
    if(!video){
        return res.status(404).render("404", {pageTitle: "Video Not Found."});
    }
    return res.render("videos/watch", {pageTitle: video.title, video});
};

export const getEdit = async(req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id);
    const { user: {_id} } = req.session;
    if(!video){
        return res.status(404).render("404", {pageTitle: "Video Not Found."});
    }

    if(String(video.owner) !== String(_id)){
        return res.status(403).redirect('/');
    }

    return res.render("videos/edit", {pageTitle: `Editing '${video.title}'`,video});
};

export const postEdit = async(req, res) => {
    const { id } = req.params;
    const {title, description, hashtags} = req.body;
    const { user: {_id} } = req.session;
    const video = await Video.exists({_id: id});
    if(!video){
        return res.status(404).render("404", {pageTitle: "Video Not Found."});
    }

    if(String(video.owner) !== String(_id)){
        return res.status(403).redirect('/');
    }

    await Video.findByIdAndUpdate(id,{
        title,
        description,
        hashtags: Video.formatHashtag(hashtags),
    })

    return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
    return res.render("videos/upload",{pageTitle: 'Upload Video'})
};

export const postUpload = async(req, res) => {
    const { user: _id } = req.session;
    const { title, description, hashtags } = req.body;
    const { path : videoURL } = req.file;
    
    try{
        const newVideo = await Video.create({
        videoURL,
        title,
        description,
        hashtags: Video.formatHashtag(hashtags),
        owner: _id,
        });
        const user = await User.findById(_id);
        user.videos.push(newVideo._id);
        user.save();
        return res.redirect('/');
    }catch(err){
        return res.status(400).render("videos/upload",{pageTitle: 'Upload Video', errorMessage: err._message});
    }
};

export const deleteVideo = async(req, res) => {
    const { id } = req.params;
    const { user: {_id} } = req.session;
    const video = await Video.findById(id);

    if(!video){
        return res.status(404).render("404", {pageTitle: "Video Not Found."});
    }

    if(String(video.owner) !== String(_id)){
        return res.status(403).redirect('/');
    }

    await Video.findByIdAndDelete(id)
    return res.redirect('/');
}

export const search = async(req,res) => {
    const { keyword } = req.query;
    let videos = [];
    if(keyword){
        videos = await Video.find({
            title:{
                $regex : new RegExp(`${keyword}`,'i')
            }
        })
    }
    return res.render("search",{pageTitle: "Search Videos", videos});
}