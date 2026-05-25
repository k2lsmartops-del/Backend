import { Body, Controller, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import { SignatureRequestDto } from './dto/signature-request.dto';

/**
 * POST /uploads/signature — Génère une signature Cloudinary.
 * Route authentifiée (tout utilisateur connecté).
 */
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('signature')
  getSignature(
    @Body() dto: SignatureRequestDto = {} as SignatureRequestDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.uploadsService.generateSignature(
      user.id,
      dto?.folder,
      dto?.publicId,
    );
  }
}
