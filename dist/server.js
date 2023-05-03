"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uploadFile_1 = __importDefault(require("./routes/uploadFile"));
const createIssue_1 = __importDefault(require("./routes/createIssue"));
const loginJira_1 = __importDefault(require("./routes/loginJira"));
const app = (0, express_1.default)();
let PORT = process.env.PORT || 5000;
app.set("trust proxy", true);
const whitelist = [
    "http://localhost:8000",
    "https://hackerearth.atlassian.net",
    "https://jira-wizard.vercel.app",
];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            console.log("origin", origin);
            callback(null, true);
        }
        else {
            console.log("origin", origin);
            const error = new Error("Not allowed by CORS");
            error.status = 403;
            callback(error);
        }
    },
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", uploadFile_1.default);
app.use("/api", createIssue_1.default);
app.use("/api", loginJira_1.default);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).send({
        message: err.message,
    });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
