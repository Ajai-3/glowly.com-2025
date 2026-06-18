import cloudinary from 'cloudinary';
import pkg from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const CloudinaryStorage = pkg.CloudinaryStorage || pkg;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const brandStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'brands',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage });
const uploadBrandImage = multer({ storage: brandStorage });
const uploadProfileImage = multer({ storage: profileStorage });

const uploadImages = upload.fields([
  { name: 'sharedImages', maxCount: 10 },
  { name: 'variantImages', maxCount: 10 },
  { name: 'variantImages_0', maxCount: 10 },
  { name: 'variantImages_1', maxCount: 10 },
  { name: 'variantImages_2', maxCount: 10 },
  { name: 'variantImages_3', maxCount: 10 },
  { name: 'variantImages_4', maxCount: 10 },
  { name: 'variantImages_5', maxCount: 10 },
  { name: 'variantImages_6', maxCount: 10 },
  { name: 'variantImages_7', maxCount: 10 },
  { name: 'variantImages_8', maxCount: 10 },
]);

const cloudinaryV2 = cloudinary.v2;
export { upload, uploadBrandImage, uploadProfileImage, uploadImages, cloudinaryV2 as cloudinary };
