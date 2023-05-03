"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.post("/issue", async (req, res) => {
    const { domain, email, jiraToken } = req.body;
    const bodyData = req.body;
    const baseUrl = `https://${domain}.atlassian.net/rest/api/3`;
    const ciphertext = jiraToken;
    const secretKey = "6eb495a40e5f50b839fcfaa5e3e0d37b6bd17fbd887c4a1ac28f9d0eb25bde01";
    const bytes = crypto_js_1.default.AES.decrypt(ciphertext, secretKey);
    const token = bytes.toString(crypto_js_1.default.enc.Utf8);
    try {
        const response = await axios_1.default.post(`${baseUrl}/issue`, bodyData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
            },
        });
        res
            .status(201)
            .send(`Issue created successfully with key ${JSON.stringify(response.data.key)} and url ${JSON.stringify(response.data.self)}`);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({
            message: `${JSON.stringify(error.response.data.errors)}`,
        });
    }
});
exports.default = router;
