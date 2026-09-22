const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===============================
// Upload folder
// ===============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ===============================
// Multer configuration
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF, JPG and PNG files are allowed."),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ===============================
// Home route
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "FormBuddy API is running",
  });
});

// ===============================
// AI Analysis
// ===============================

app.post(
  "/api/analyze",
  upload.single("form"),
  async (req, res) => {
    let uploadedOpenAIFile = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded.",
        });
      }

      console.log(
        "Analyzing:",
        req.file.originalname
      );

      const prompt = `
You are FormBuddy AI, an expert assistant for helping people understand complex forms.

Analyze the uploaded form carefully.

Your job is NOT to fill in personal information that is unknown.
Instead, explain the form in simple language so the user can complete it correctly.

Return:

1. What the form is for
2. Who normally needs this form
3. Every important field/section found in the form
4. Simple explanation of each field
5. What the user should enter in each field
6. Required documents mentioned or clearly implied by the form
7. Possible mistakes the user should avoid
8. Important notes or warnings

Use simple English.
Do not invent information that is not present in the form.
If something is unclear, say "Not clearly specified in the form."

For sensitive fields such as Aadhaar number, PAN, bank account number, password, OTP, etc., explain what the field means but do not ask the user to share those values with FormBuddy.

Return the answer in the requested JSON structure.
`;

      let response;

      // ===============================
      // PDF
      // ===============================

      if (req.file.mimetype === "application/pdf") {
        uploadedOpenAIFile = await openai.files.create({
          file: fs.createReadStream(req.file.path),
          purpose: "user_data",
        });

        response = await openai.responses.create({
          model: "gpt-5.6-luna",

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_file",
                  file_id: uploadedOpenAIFile.id,
                  detail: "high",
                },

                {
                  type: "input_text",
                  text: prompt,
                },
              ],
            },
          ],

          text: {
            format: {
              type: "json_schema",

              name: "form_analysis",

              strict: true,

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

                      additionalProperties: false,
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

                additionalProperties: false,
              },
            },
          },
        });
      }

      // ===============================
      // IMAGE
      // ===============================

      else {
        const imageBuffer = fs.readFileSync(
          req.file.path
        );

        const base64Image =
          imageBuffer.toString("base64");

        const imageDataUrl =
          `data:${req.file.mimetype};base64,${base64Image}`;

        response = await openai.responses.create({
          model: "gpt-5.6-luna",

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_image",
                  image_url: imageDataUrl,
                  detail: "high",
                },

                {
                  type: "input_text",
                  text: prompt,
                },
              ],
            },
          ],

          text: {
            format: {
              type: "json_schema",

              name: "form_analysis",

              strict: true,

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

                      additionalProperties: false,
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

                additionalProperties: false,
              },
            },
          },
        });
      }

      const analysis = JSON.parse(
        response.output_text
      );

      console.log("AI analysis completed.");

      res.json({
        success: true,
        message: "Form analyzed successfully.",
        analysis,
      });
    } catch (error) {
      console.error("AI ANALYSIS ERROR:");
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to analyze the form.",
      });
    } finally {
      // Delete local uploaded file
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (error) {
          console.log(
            "Local file cleanup failed."
          );
        }
      }

      // Delete temporary OpenAI file
      if (uploadedOpenAIFile?.id) {
        try {
          await openai.files.delete(
            uploadedOpenAIFile.id
          );
        } catch (error) {
          console.log(
            "OpenAI file cleanup failed."
          );
        }
      }
    }
  }
);

// ===============================
// Error handler
// ===============================

app.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message:
            "File size must be less than 10 MB.",
        });
      }
    }

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Something went wrong.",
    });
  }
);

// ===============================
// Start server
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `FormBuddy server running on http://localhost:${PORT}`
  );
});
