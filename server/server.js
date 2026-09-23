const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

/* =========================
   UPLOAD FOLDER
========================= */

const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, JPG and PNG files are allowed."
        )
      );
    }
  },
});

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FormBuddy AI server is running 🚀",
  });
});

/* =========================
   ANALYZE FORM
========================= */

app.post(
  "/api/analyze",
  upload.single("form"),
  async (req, res) => {
    let uploadedFilePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a form.",
        });
      }

      uploadedFilePath = req.file.path;

      console.log(
        `📄 Received file: ${req.file.originalname}`
      );

      /* =========================
         UPLOAD FILE TO GEMINI
      ========================= */

      const geminiFile = await ai.files.upload({
        file: uploadedFilePath,
      });

      console.log("☁️ File uploaded to Gemini");

      /* =========================
         AI PROMPT
      ========================= */

      const prompt = `
You are FormBuddy AI, an intelligent assistant that helps people understand and complete complicated forms.

Analyze the uploaded form carefully.

Your job is to make the form easy for a normal person to understand.

IMPORTANT RULES:

1. Do not invent information.
2. Only provide information that can reasonably be understood from the uploaded document.
3. Explain important fields in simple English.
4. Also provide a simple Hinglish explanation for every important field.
5. Explain what the user should enter in each field.
6. Also provide a Hinglish version of what the user should enter.
7. Identify the purpose of the form.
8. Explain who needs this form.
9. Identify required documents.
10. Identify possible common mistakes.
11. Identify important notes, instructions, deadlines, eligibility requirements, signatures, declarations and verification requirements if present.
12. If something is not clearly available in the form, say that it is not specified instead of guessing.
13. Keep explanations beginner-friendly.
14. Hinglish should be natural Indian Hinglish written using English alphabet.
15. Do not use complex Hindi words.

Return ONLY valid JSON matching the exact structure below.

{
  "formPurpose": "Simple English explanation",
  "formPurposeHinglish": "Simple Hinglish explanation",

  "whoNeedsIt": "Simple English explanation",
  "whoNeedsItHinglish": "Simple Hinglish explanation",

  "fields": [
    {
      "fieldName": "Field name",
      "explanation": "What this field means in simple English",
      "whatToEnter": "What the user should enter in simple English",
      "hinglishExplanation": "What this field means in simple Hinglish",
      "hinglishWhatToEnter": "What the user should enter in simple Hinglish"
    }
  ],

  "documents": [
    "Document name"
  ],

  "documentsHinglish": [
    "Document name explained in simple Hinglish"
  ],

  "mistakes": [
    "Possible mistake"
  ],

  "mistakesHinglish": [
    "Possible mistake explained in simple Hinglish"
  ],

  "importantNotes": [
    "Important note"
  ],

  "importantNotesHinglish": [
    "Important note explained in simple Hinglish"
  ]
}
`;

      /* =========================
         GEMINI INTERACTION
      ========================= */

      const interaction =
        await ai.interactions.create({
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

                formPurposeHinglish: {
                  type: "string",
                },

                whoNeedsIt: {
                  type: "string",
                },

                whoNeedsItHinglish: {
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

                      hinglishExplanation: {
                        type: "string",
                      },

                      hinglishWhatToEnter: {
                        type: "string",
                      },
                    },

                    required: [
                      "fieldName",
                      "explanation",
                      "whatToEnter",
                      "hinglishExplanation",
                      "hinglishWhatToEnter",
                    ],
                  },
                },

                documents: {
                  type: "array",

                  items: {
                    type: "string",
                  },
                },

                documentsHinglish: {
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

                mistakesHinglish: {
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

                importantNotesHinglish: {
                  type: "array",

                  items: {
                    type: "string",
                  },
                },
              },

              required: [
                "formPurpose",
                "formPurposeHinglish",
                "whoNeedsIt",
                "whoNeedsItHinglish",
                "fields",
                "documents",
                "documentsHinglish",
                "mistakes",
                "mistakesHinglish",
                "importantNotes",
                "importantNotesHinglish",
              ],
            },
          },

          store: false,
        });

      /* =========================
         PARSE AI RESPONSE
      ========================= */

      const analysisText =
        interaction.output_text;

      const analysis =
        JSON.parse(analysisText);

      console.log("✅ Form analysis completed");

      /* =========================
         DELETE LOCAL FILE
      ========================= */

      if (
        uploadedFilePath &&
        fs.existsSync(uploadedFilePath)
      ) {
        fs.unlinkSync(uploadedFilePath);
      }

      /* =========================
         RESPONSE
      ========================= */

      res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error(
        "❌ Form analysis error:",
        error
      );

      if (
        uploadedFilePath &&
        fs.existsSync(uploadedFilePath)
      ) {
        try {
          fs.unlinkSync(uploadedFilePath);
        } catch (deleteError) {
          console.error(
            "File deletion error:",
            deleteError
          );
        }
      }

      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File size must be less than 10 MB.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Form analysis failed.",
      });
    }
  }
);

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `🚀 FormBuddy AI server running on http://localhost:${PORT}`
  );
});
