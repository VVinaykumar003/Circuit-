import multer from "multer";
import nextConnect from "next-connect";
import path from "path";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads",
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(500).json({ error: `Upload error: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(upload.single("file"));

apiRoute.post((req, res) => {
  res.status(200).json({ url: `/uploads/${req.file.filename}` });
});

export default apiRoute;
export const config = { api: { bodyParser: false } };
