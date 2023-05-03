import express, { Router, Request, Response } from "express";
import multer, { Multer } from "multer";
import * as XLSX from "xlsx";

const router: Router = express.Router();

interface File extends Express.Multer.File {
  buffer: Buffer;
}

interface FormData {
  summary: string;
  description: string;
  project_key: string;
  issuetype_name: string;
  priority: string;
}

const storage = multer.memoryStorage();
const upload: Multer = multer({
  storage: storage,
  limits: { fileSize: 50000000 }, // Limit file size to 50MB
});

router.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  const selectedFile = req.file as File;

  if (!selectedFile) {
    // handle error when user doesn't select a file
    res.status(400).send({ error: "No file selected" });
    return;
  }

  if (
    selectedFile.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
    selectedFile.mimetype !== "application/json"
  ) {
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
    let data: FormData[] | any[];
    if (selectedFile.mimetype === "application/json") {
      data = JSON.parse(selectedFile.buffer.toString()) as FormData[];
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
      const missingFields = requiredFields.filter(
        (field) => !Object.keys(data[0]).includes(field)
      );

      if (missingFields.length !== 0) {
        res.status(400).send({
          message: `Fields missing: ${missingFields.join(", ")}`,
        });
        return;
      } else {
        res.send(transformedData);
        return;
      }
    } else {
      const workbook = XLSX.read(selectedFile.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const headers = Object.keys(worksheet)
        .filter((key) => key[1] === "1")
        .map((key) => worksheet[key].v);
      data = XLSX.utils.sheet_to_json(worksheet) as FormData[];
      const requiredFields = [
        "summary",
        "description",
        "project_key",
        "issuetype_name",
        "priority",
      ];
      const missingFields = requiredFields.filter(
        (field) => !headers.includes(field)
      );
      if (missingFields.length > 0) {
        res.status(400).send({
          message: `Fields missing: ${missingFields.join(", ")}`,
        });
        return;
      }
    }

    const rows: FormData[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      rows.push(row);
    }
    res.send({ data: rows });
  } catch (error: any) {
    console.error(error);
    res.status(400).send({
      message: `JSON format is not valid. \n Valid format is: { summary: "", description: "", project_key: "", issuetype_name: "", priority: "" }`,
    });
  }
});

export default router;
