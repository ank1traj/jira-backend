"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const router = express_1.default.Router();
// Create a rate limiter middleware
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10, // Allow a maximum of 10 requests per minute
});
router.post("/user", limiter, async (req, res) => {
    const { domain, email, jiraToken } = req.body;
    console.log(domain, email, jiraToken);
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ message: "Internal server error" });
    }
    try {
        const bytes = crypto_js_1.default.AES.decrypt(jiraToken, secretKey);
        const token = bytes.toString(crypto_js_1.default.enc.Utf8);
        const response = await axios_1.default.get(`https://${domain}.atlassian.net/rest/api/3/myself`, {
            headers: {
                Accept: "application/json",
                Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
            },
        });
        return res.status(200).json(response.data);
    }
    catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
            console.log(error.response.status);
            return res
                .status(401)
                .json({ message: "Unauthorized, Check email or API key" });
        }
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ message: "This domain is not valid" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
