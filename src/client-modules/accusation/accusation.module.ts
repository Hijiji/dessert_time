import { Module } from '@nestjs/common';
import { AccusationController } from './accusation.controller';
import { AccusationService } from './accusation.service';
import { AccusationRepository } from './accusation.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accusation } from 'src/config/entities/accusation.entity';
import { Review } from 'src/config/entities/review.entity';
import { BlockedMember } from 'src/config/entities/blocked.member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accusation, Review, BlockedMember])],
  controllers: [AccusationController],
  providers: [AccusationService, AccusationRepository],
})
export class AccusationModule {}
