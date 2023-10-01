import express, { Router, Request, Response } from "express";
import axios from "axios";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const router: Router = express.Router();

// Create a rate limiter middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Allow a maximum of 10 requests per minute
});

interface UserRequestBody {
  domain: string;
  email: string;
  jiraToken: string;
}

interface JiraUser {
  accountId: string;
  accountType: string;
  active: boolean;
  displayName: string;
  emailAddress: string;
  key: string;
  locale: string;
  name: string;
  self: string;
  timeZone: string;
}

router.post(
  "/user",
  limiter,
  async (
    req: Request<{}, {}, UserRequestBody>,
    res: Response<JiraUser | { message: string }>
  ) => {
    const { domain, email, jiraToken } = req.body;
    console.log(domain, email, jiraToken);
    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({ message: "Internal server error" });
    }

    try {
      const bytes = CryptoJS.AES.decrypt(jiraToken, secretKey);
      const token = bytes.toString(CryptoJS.enc.Utf8);

      const response = await axios.get<JiraUser>(
        `https://${domain}.atlassian.net/rest/api/3/myself`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString(
              "base64"
            )}`,
          },
        }
      );

      return res.status(200).json(response.data);
    } catch (error: any) {
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
  }
);

export default router;
