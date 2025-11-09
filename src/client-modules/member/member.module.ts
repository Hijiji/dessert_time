import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberRepository } from './member.repository';
import { Member } from 'src/config/entities/member.entity';
import { Review } from 'src/config/entities/review.entity';
import { Point } from 'src/config/entities/point.entity';
import { PointHistory } from 'src/config/entities/point.history.entity';
import { Notice } from 'src/config/entities/notice.entity';
import { UserInterestDessert } from 'src/config/entities/user.interest.dessert.entity';
import { MemberDeletion } from 'src/config/entities/member.deleteion.entity';
import { AuthModule } from 'src/config/auth/auth.module';
import { ProfileImg } from 'src/config/entities/profile.img.entity';
import { FileTransService } from 'src/config/file/filetrans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Member, ProfileImg, Review, Point, PointHistory, Notice, UserInterestDessert, MemberDeletion]), AuthModule],
  exports: [],
  controllers: [MemberController],
  providers: [MemberService, MemberRepository, FileTransService],
})
export class MemberModule {}
