"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 50000000 }, // Limit file size to 50MB
});
router.post("/upload", upload.single("file"), (req, res) => {
    const selectedFile = req.file;
    if (!selectedFile) {
        // handle error when user doesn't select a file
        res.status(400).send({ error: "No file selected" });
        return;
    }
    if (selectedFile.mimetype !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        selectedFile.mimetype !== "application/json") {
        // handle error when file is not in the required format
        res.status(400).send({ error: "Invalid file format" });
        return;
    }
    if (selectedFile.size > 50000000) {
        // handle error when file size is greater than 50MB
        res.status(400).send({ error: "File size should not exceed 50MB" });
        return;
    }
    try {
        let data;
        if (selectedFile.mimetype === "application/json") {
            data = JSON.parse(selectedFile.buffer.toString());
            const requiredFields = [
                "summary",
                "description",
                "project_key",
                "issuetype_name",
                "priority",
            ];
            const transformedData = {
                data: [data],
            };
            const missingFields = requiredFields.filter((field) => !Object.keys(data[0]).includes(field));
            if (missingFields.length !== 0) {
                res.status(400).send({
                    message: `Fields missing: ${missingFields.join(", ")}`,
                });
                return;
            }
            else {
                res.send(transformedData);
                return;
            }
        }
        else {
            const workbook = XLSX.read(selectedFile.buffer, { type: "buffer" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const headers = Object.keys(worksheet)
                .filter((key) => key[1] === "1")
                .map((key) => worksheet[key].v);
            data = XLSX.utils.sheet_to_json(worksheet);
            const requiredFields = [
                "summary",
                "description",
                "project_key",
                "issuetype_name",
                "priority",
            ];
            const missingFields = requiredFields.filter((field) => !headers.includes(field));
            if (missingFields.length > 0) {
                res.status(400).send({
                    message: `Fields missing: ${missingFields.join(", ")}`,
                });
                return;
            }
        }
        const rows = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            rows.push(row);
        }
        res.send({ data: rows });
    }
    catch (error) {
        console.error(error);
        res.status(400).send({
            message: `JSON format is not valid. \n Valid format is: { summary: "", description: "", project_key: "", issuetype_name: "", priority: "" }`,
        });
    }
});
exports.default = router;
