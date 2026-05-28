import { Module } from '@nestjs/common';
import { SecteursController } from './secteurs.controller';
import { SecteursService } from './secteurs.service';

@Module({
  controllers: [SecteursController],
  providers: [SecteursService],
  exports: [SecteursService],
})
export class SecteursModule {}
