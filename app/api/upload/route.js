// import multer from "multer";
// import nextConnect from "next-connect";
// import path from "path";

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: "./public/uploads",
//     filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
//   }),
// });

// const apiRoute = nextConnect({
//   onError(error, req, res) {
//     res.status(500).json({ error: `Upload error: ${error.message}` });
//   },
//   onNoMatch(req, res) {
//     res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
//   },
// });

// apiRoute.use(upload.single("file"));

// apiRoute.post((req, res) => {
//   res.status(200).json({ url: `/uploads/${req.file.filename}` });
// });

// export default apiRoute; 
// export const config = { api: { bodyParser: false } };

import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import multer from "multer";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Utility: Convert buffer to readable stream
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

// Multer config to get file buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const stream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) {
          throw new Error("Cloudinary upload failed");
        }
      }
    );

    // Wrap in Promise
    const uploadPromise = new Promise((resolve, reject) => {
      const cloudinaryStream = cloudinary.uploader.upload_stream(
        { folder: "uploads" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      bufferToStream(buffer).pipe(cloudinaryStream);
    });

    const result = await uploadPromise;

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
