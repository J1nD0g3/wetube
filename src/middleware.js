import multer from "multer";

export const localsMiddleware = (req, res, next) => {
    res.locals.loggedIn = Boolean(req.session.loggedIn);
    res.locals.siteName = "Wetube";
    res.locals.loggedInUser = req.session.user || {};
    next();
}

export const protectorMiddleware = (req, res, next) => {
    if(req.session.loggedIn){
        next();
    }
    else{
        res.write("<script>alert('LogIn First!')</script>");
        res.write("<script>window.location='http://localhost:4000/login'</script>");
        //res.redirect("/login");
    }
}

export const publicOnlyMiddleware = (req, res, next) => {
    if(!req.session.loggedIn){
        next();
    }
    else{
        res.write("<script>alert('LogOut First!')</script>");
        res.write("<script>window.location='http://localhost:4000/'</script>");
        //res.redirect("/login");
    }
}

export const uploadAvatar = multer({
    dest : 'uploads/avatar/',
    limits: {
        fileSize : 1000000 // 1MB
    },
})

export const uploadVideo = multer({
    dest : 'uploads/videos/',
    limits: {
        fileSize : 100000000 // 100MB
    }
})