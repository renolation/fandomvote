import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BusinessException } from '../../common/exceptions/business.exception';
import { UploadService } from './upload.service';

// Yêu cầu JWT (không @Public). Multipart: field 'file'.
@ApiTags('upload')
@ApiBearerAuth()
@Controller('uploads')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload ảnh lên R2 → trả về { url, key }' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BusinessException('INVALID_FILE', 'Thiếu file');
    }
    return this.upload.upload(file);
  }
}
