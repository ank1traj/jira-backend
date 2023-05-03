import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";

import uploadfileRoute from "./routes/uploadFile";
import createissueRoute from "./routes/createIssue";
import loginjiraRoute from "./routes/loginJira";

interface CustomError extends Error {
  status?: number;
}

const app = express();

let PORT = process.env.PORT || 4000;

app.set("trust proxy", true);

const whitelist = [
  "http://localhost:8000",
  "https://hackerearth.atlassian.net",
  "https://jira-wizard.vercel.app",
];
const corsOptions: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (whitelist.indexOf(origin!) !== -1 || !origin) {
      console.log("origin", origin);
      callback(null, true);
    } else {
      console.log("origin", origin);
      const error: CustomError = new Error("Not allowed by CORS");
      error.status = 403;
      callback(error);
    }
  },
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", uploadfileRoute);
app.use("/api", createissueRoute);
app.use("/api", loginjiraRoute);

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).send({
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
