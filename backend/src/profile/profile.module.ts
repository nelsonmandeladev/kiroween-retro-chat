import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, CloudinaryService],
  exports: [ProfileService, CloudinaryService],
})
export class ProfileModule {}
