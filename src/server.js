import express from "express";
import morgan from "morgan";
import session from "express-session";
import rootRouter from "./routers/rootRouter";
import videoRouter from "./routers/videoRouter";
import userRouter from "./routers/userRouter";
import { localsMiddleware } from "./middleware";
import MongoStore from "connect-mongo";

const app = express();
const logger = morgan("dev");

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(logger);
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret : process.env.COOKIE_SECRET,
        resave : false,
        saveUninitialized : false,
        store : MongoStore.create({mongoUrl : process.env.DB_URL}),
        //cookie : {maxAge : 20000}
    })
);

app.use(localsMiddleware);
app.use("/uploads", express.static('uploads'));
app.use("/",rootRouter);
app.use("/videos",videoRouter);
app.use("/users",userRouter);

export default app;