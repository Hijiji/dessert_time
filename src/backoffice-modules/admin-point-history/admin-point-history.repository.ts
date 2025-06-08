import { InjectRepository } from '@nestjs/typeorm';
import { PointHistory } from '../../config/entities/point.history.entity';
import { Repository } from 'typeorm';
import { SearchAdminPointHistoryDto } from './model/search-admin-point-history.dto';
import { UpdateAdminPointDto } from '../admin-point/model/update-admin-point.dto';
import { MemberRepository } from 'src/client-modules/member/member.repository';
import { ReviewRepository } from 'src/client-modules/review/review.repository';
import { Member } from 'src/config/entities/member.entity';
import { Review } from 'src/config/entities/review.entity';

export class AdminPointHistoryRepository {
  constructor(
    @InjectRepository(PointHistory) private adminPointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Member) private memberRepository: Repository<Member>,
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
  ) {}

  /**
   * 신규 포인트 기록 삽입
   * @param pointHistory
   * @return Promise<insertResult>
   * */
  async insert(pointHistory: Partial<PointHistory>) {
    const insertResult = await this.adminPointHistoryRepository.insert(pointHistory);
    return insertResult.identifiers.length > 0;
  }

  /**
   * 특정 회원 PointHistory 내역 수량 조회
   * @returns Promise<number>
   */
  async count(memberId: number) {
    return await this.adminPointHistoryRepository.count({
      where: {
        member: {
          memberId: memberId,
        },
      },
    });
  }

  /**
   * 특정 회원 신규 포인트 기록 전체 조회
   * @param memberId
   * @param searchAdminPointHistoryDto
   * @return Promise<insertResult>
   * */
  async findAllByMemberId(memberId: number, searchAdminPointHistoryDto: SearchAdminPointHistoryDto) {
    return this.adminPointHistoryRepository.find({
      select: {
        pointHistoryId: true,
        newPoint: true,
        pointType: true,
        createdDate: true,
        review: {
          reviewId: true,
          menuName: true,
        },
      },
      relations: ['review'],
      where: {
        member: { memberId: memberId },
      },
      skip: searchAdminPointHistoryDto.getSkip(),
      take: searchAdminPointHistoryDto.getTake(),
      order: {
        createdDate: 'DESC',
      },
    });
  }

  async findMember(memberId, reviewId) {
    return await this.adminPointHistoryRepository.findOne({
      where: {
        member: { memberId },
        review: { reviewId },
      },
    });
  }

  async createHistory(memberId, reviewId, dto) {
    return this.adminPointHistoryRepository.create({
      member: { memberId },
      review: { reviewId },
      newPoint: dto.newPoint,
      pointType: dto.pointType,
    });
  }

  async saveHistory(newHistory) {
    this.adminPointHistoryRepository.save(newHistory);
  }

  async createAndSaveHistory(memberId: number, reviewId: number, dto: UpdateAdminPointDto) {
    const member = await this.memberRepository.findOne({ where: { memberId } });
    const review = await this.reviewRepository.findOne({ where: { reviewId } });

    if (!member || !review) {
      throw new Error('Member or Review not found');
    }

    const newHistory = this.adminPointHistoryRepository.create({
      member,
      review,
      newPoint: dto.newPoint,
      pointType: dto.pointType,
    });

    return await this.adminPointHistoryRepository.save(newHistory);
  }
}
