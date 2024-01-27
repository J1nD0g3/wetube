import User from "../models/User";
import Video from "../models/Video";
//import fetch from "node-fetch";
import session from "express-session";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
    return res.render("join", {pageTitle: "Create Account"})
};

export const postJoin = async(req, res) => {
    const { name, username, password, password2, email, location} = req.body;
    const pageTitle = "Create Account";
    
    if(password !== password2){
        return res.status(400).render("join", {pageTitle, errorMessage : 'Password Confirmation Fail'});
    }

    const exists = await User.exists({$or : [{username}, {email}]});
    if(exists){
        return res.status(400).render("join", {pageTitle, errorMessage : 'The username/email is already taken.'});
    }
    try{
        await User.create({
            name, username, password, email, location
        });
        return res.redirect("/login");
    }catch(err){
        return res.status(400).render("join",{
            pageTitle,
            errorMessage : err._message
        })
    }
};

export const getLogin = (req, res) => {
    return res.render("login",{pageTitle: "Login"});
};

export const postLogin = async(req, res) => {
    const { username, password } = req.body;
    const pageTitle = "Login";
    const user = await User.findOne({username});
    if(!user){
        return res.status(400).render("login",{pageTitle, errorMessage: "Not existing username.."});
    }
    
    const ok = await bcrypt.compare(password, user.password);
    if(!ok){
        return res.status(400).render("login",{pageTitle, errorMessage: "Wrong Password.."});
    }
    req.session.loggedIn = true;
    req.session.user = user;
    
    return res.redirect("/");
}

export const startGithubLogin = (req, res) => {
    const baseURL = "https://github.com/login/oauth/authorize";
    const config = {
        client_id : process.env.GH_CLIENT,
        allow_signup : false,
        scope : "read:user user:email",
    }
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;
    return res.redirect(finalURL);
}

export const finishGithubLogin = async(req, res) => {
    const baseURL = "https://github.com/login/oauth/access_token";
    const config = {
        client_id : process.env.GH_CLIENT,
        client_secret : process.env.GH_SECRET,
        code : req.query.code,
    }
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;

    const tokenRequset = await (
        await fetch(finalURL, {
            method : "POST",
            headers: {
                Accept: "application/json",
            },
        })).json();
    if ("access_token" in tokenRequset){
        const { access_token } = tokenRequset;
        const apiURL = "https://api.github.com";
        const userData = await (
            await fetch(`${apiURL}/user`, {
                headers: {
                    Authorization : `token  ${access_token}`
                }
            })
        ).json();

        const emailData = await (
            await fetch(`${apiURL}/user/emails`, {
                headers: {
                    Authorization : `token  ${access_token}`
                }
            })
        ).json();

        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        if(!emailObj){
            return res.redirect("/login");
        }

        let user = await User.findOne({email : emailObj.email});
        if (!user){
            //should create an account
            user = await User.create({
                avatarURL: userData.avatar_url,
                name: userData.name,
                socialOnly: true,
                username: userData.login, 
                password: "", 
                email: emailObj.email, 
                location: userData.location,
            });
        }
        req.session.loggedIn = true;
        req.session.user = user;
        res.redirect("/");
    }else{
        return res.redirect("/login");
    }
    
}

export const logout = (req, res) => {
    req.session.destroy();
    return res.redirect("/")
};

export const getEdit = (req, res) => {
    return res.render("users/edit-profile", {pageTitle : "Edit Profile"});
}
export const postEdit = async (req, res) => {
    const pageTitle = "Edit Profile";
    const {
        session : {
            user : {
                _id: _id, 
                username: sessionUsername, 
                email : sessionEmail, 
                avatarURL : sessionAvatarURL
            } 
        },
        body : {
            name, username, email, location
        },
        file
    } = req;
    console.log(file);
    
    //code challenge - start
    let searchParams = []
    if (sessionUsername !== username)
        searchParams.push({username})
    if (sessionEmail !== email)
        searchParams.push({email})

    if (searchParams.length > 0){
        const foundUser = await User.findOne({$or : searchParams});
        
        if(foundUser){
            //console.log(foundUser._id.toString())
            //console.log(_id)
            return res.status(400).render("user/edit-profile", {pageTitle, errorMessage : 'The username/email is already taken.'});
        }
    }
    //code chanlleng - end

    const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
        avatarURL : file ? file.path : sessionAvatarURL,
        name, username, email, location
        },
        {new: true}
    );
    
    req.session.user = updatedUser;

    return res.redirect("/users/edit")
}


export const getChangePassword = (req, res) => {
    if(req.session.user.socialOnly === true)
        return res.redirect("/");
    return res.render("users/change-password",{pageTitle: "Change Password"});
};

export const postChangePassword = async (req, res) => {
    const pageTitle = "Change Password";
    const {
        session : {
            user : {_id, password} 
        },
        body : {
            oldPW, newPW, newPW2
        }
    } = req; 

    const ok = await bcrypt.compare(oldPW, password);
    if(!ok){
        return res.status(400).render("users/change-password", 
        {pageTitle, errorMessage : 'Wrong password..'}
        );
    }

    if(newPW !== newPW2){
        return res.status(400).render("users/change-password", 
        {pageTitle, errorMessage : 'Please Enter the same password.'}
        );
    }

    const user = await User.findById({_id});
    user.password = newPW;
    await user.save();
    req.session.user.password = user.password;

    return res.redirect("/");
};

export const see = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate('videos');
    if(!user){
        return res.status(404).render("404",{pageTitle: 'User not found...'});
    }

    return res.render("users/profile", {
        pageTitle:`${user.name}'s Profile`, 
        user,
    });
};