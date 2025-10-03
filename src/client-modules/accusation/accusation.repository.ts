import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Accusation } from 'src/config/entities/accusation.entity';
import { Repository } from 'typeorm';
import { PostAccusationDto } from './dto/post.accusation.dto';
import { AccusationRecordDto } from './dto/accusation.record.dto';
import { Review } from 'src/config/entities/review.entity';
import { BlockedMember } from 'src/config/entities/blocked.member.entity';

@Injectable()
export class AccusationRepository {
  constructor(
    @InjectRepository(Accusation) private accustion: Repository<Accusation>,
    @InjectRepository(Review) private review: Repository<Review>,
    @InjectRepository(BlockedMember) private blockedMember: Repository<BlockedMember>,
  ) {}

  /**
   * 신고 등록
   * @param postAccusationDto
   * @returns
   */
  async insertAccusation(postAccusationDto: PostAccusationDto) {
    return await this.accustion.insert({
      reason: postAccusationDto.reason,
      content: postAccusationDto.content,
      member: { memberId: postAccusationDto.memberId },
      review: { reviewId: postAccusationDto.reviewId },
    });
  }

  /**
   * 신고한 리뷰 갯수 카운트
   */
  async countAccusation(postAccusationDto: PostAccusationDto) {
    return await this.accustion.count({ where: { review: { reviewId: postAccusationDto.reviewId } } });
  }

  /**
   * 리뷰 조회 안되게 업데이트
   */
  async updateReview(reviewId) {
    await this.review.update({ reviewId }, { isUsable: false });
  }

  /**
   * 사용자,리뷰가 동일한 신고기록있는지 확인
   * @param accusationRecordDto
   * @returns
   */
  async findPreAccuRecord(accusationRecordDto: AccusationRecordDto) {
    return await this.accustion.findOne({
      where: {
        member: { memberId: accusationRecordDto.memberId },
        review: { reviewId: accusationRecordDto.reviewId },
      },
      select: { accusationId: true },
    });
  }

  /**
   * 차단 엔티티에 사용자 매핑
   * @param postAccusationDto
   */
  async insertBlockedMember(postAccusationDto: PostAccusationDto) {
    await this.blockedMember.insert({ blockedMemberId: postAccusationDto.blockedMemberId, primaryMemberId: postAccusationDto.memberId });
  }
}
