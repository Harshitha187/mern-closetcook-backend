import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware for single file upload (profile picture)
export const uploadSingle = upload.single('profilePicture');

// Middleware for multiple file upload (post images)
export const uploadMultiple = upload.array('images', 5); // Max 5 images per post

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.json({ success: false, message: 'File size too large. Maximum 10MB allowed.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.json({ success: false, message: 'Too many files. Maximum 5 images allowed.' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.json({ success: false, message: 'Only image files are allowed!' });
  }
  
  next(error);
};
