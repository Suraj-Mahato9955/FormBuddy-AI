const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG and PNG files are allowed."));
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.get("/", (req, res) => {
  res.json({
    message: "FormBuddy AI server is running 🚀",
  });
});

app.post("/api/analyze", upload.single("form"), async (req, res) => {
  let uploadedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF, JPG or PNG file.",
      });
    }

    uploadedFilePath = req.file.path;

    console.log("📄 File received:", req.file.originalname);

    console.log("⬆️ Uploading file to Gemini...");

    const geminiFile = await ai.files.upload({
      file: uploadedFilePath,
      config: {
        mimeType: req.file.mimetype,
        displayName: req.file.originalname,
      },
    });

    console.log("✅ File uploaded to Gemini");

    const prompt = `
You are FormBuddy AI, an intelligent assistant that helps ordinary people
understand and complete complicated forms.

Analyze the uploaded form carefully.

Your job is NOT to invent information.

Extract and explain only what can reasonably be determined from the form.

For every important field:
1. Give the field name.
2. Explain what the field means in very simple language.
3. Explain what the user should enter in that field.
4. If the answer depends on personal information, clearly tell the user
   that they need to provide their own information.

Also identify:

- What this form is for
- Who normally needs this form
- Required documents mentioned in the form
- Common mistakes a person may make
- Important instructions or notes
- Deadlines visible in the form
- Eligibility requirements visible in the form
- Signature requirements
- Declaration or verification requirements

Important rules:

- Do not invent missing information.
- Do not guess personal information.
- Do not claim something is required unless the form indicates it.
- Keep explanations beginner-friendly.
- Use simple English.
- If the form contains Hindi or another language, understand it and
  explain it in simple English.
- If something is unclear, say that it is unclear instead of guessing.

Return ONLY valid JSON matching the requested structure.
`;

    console.log("🤖 Sending form to Gemini Interactions API...");

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",

      input: [
        {
          type: "document",
          uri: geminiFile.uri,
          mime_type: geminiFile.mimeType,
        },
        {
          type: "text",
          text: prompt,
        },
      ],

      response_format: {
        type: "text",
        mime_type: "application/json",

        schema: {
          type: "object",

          properties: {
            formPurpose: {
              type: "string",
            },

            whoNeedsIt: {
              type: "string",
            },

            fields: {
              type: "array",

              items: {
                type: "object",

                properties: {
                  fieldName: {
                    type: "string",
                  },

                  explanation: {
                    type: "string",
                  },

                  whatToEnter: {
                    type: "string",
                  },
                },

                required: [
                  "fieldName",
                  "explanation",
                  "whatToEnter",
                ],
              },
            },

            documents: {
              type: "array",
              items: {
                type: "string",
              },
            },

            mistakes: {
              type: "array",
              items: {
                type: "string",
              },
            },

            importantNotes: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },

          required: [
            "formPurpose",
            "whoNeedsIt",
            "fields",
            "documents",
            "mistakes",
            "importantNotes",
          ],
        },
      },

      // Prevent storing the interaction unnecessarily
      store: false,
    });

    console.log("✅ Gemini analysis completed");

    const responseText = interaction.output_text;

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    let analysis;

    try {
      analysis = JSON.parse(responseText);
    } catch (error) {
      console.error("Invalid Gemini JSON:", responseText);

      throw new Error(
        "Gemini returned an invalid analysis response."
      );
    }

    console.log("📊 Analysis ready");

    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    res.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error("❌ Form analysis error:", error);

    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Could not delete temporary file.");
      }
    }

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Something went wrong while analyzing the form.",
    });
  }
});

app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size must be less than 10 MB.",
      });
    }
  }

  res.status(500).json({
    message:
      error.message ||
      "Something went wrong on the server.",
  });
});

app.listen(PORT, () => {
  console.log(
    `🚀 FormBuddy AI server running on http://localhost:${PORT}`
  );
});
