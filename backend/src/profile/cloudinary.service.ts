import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userProfile } from '../db/schema';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      const uploadOptions = {
        folder: `appacheur/trust-bridge/categories/icons`,
        public_id: `${file.filename}_${Date.now()}`,
        resource_type: 'auto' as const,
      };
      // Upload to Cloudinary
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .unsigned_upload_stream(
            'ml_default',
            uploadOptions,
            (error, result) => {
              if (error) {
                reject(
                  error instanceof Error ? error : new Error(String(error)),
                );
              } else if (result) {
                resolve(result as UploadApiResponse);
              } else {
                reject(new Error('Upload failed with no error message'));
              }
            },
          )
          .end(file.buffer);
      });

      const profilePictureUrl = result.secure_url;

      // Update user profile with new picture URL
      await db
        .update(userProfile)
        .set({ profilePictureUrl })
        .where(eq(userProfile.userId, userId));

      return profilePictureUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(error);
      throw new BadRequestException(message);
    }
  }
}
