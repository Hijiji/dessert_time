import { Inject, Injectable } from '@nestjs/common';
import { AdminPointHistoryRepository } from './admin-point-history.repository';
import { UpdateAdminPointDto } from '../admin-point/model/update-admin-point.dto';
import { Page } from '../common/dto/page.dto';
import { SearchAdminPointHistoryDto } from './model/search-admin-point-history.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AdminPointHistoryService {
  constructor(@Inject() private adminPointHistoryRepository: AdminPointHistoryRepository) {}

  /**
   * 신규 PointHistory 삽입
   * @param memberId
   * @param updateAdminPointDto
   * @param reviewId
   * @return Promise<boolean>
   * */
  @Transactional()
  async insert(memberId: number, updateAdminPointDto: UpdateAdminPointDto, reviewId: number = null) {
    const member = {};
    member['memberId'] = memberId;

    const pointHistory = {};
    pointHistory['member'] = member;
    pointHistory['newPoint'] = updateAdminPointDto.newPoint;
    pointHistory['pointType'] = updateAdminPointDto.pointType;

    if (reviewId !== null) {
      const review = {};
      review['reviewId'] = reviewId;
      pointHistory['review'] = review;
    }

    return await this.adminPointHistoryRepository.insert(pointHistory);
  }

  /**
   * 특정 회원 포인트 내역 전체 조회
   * @param memberId
   * @param searchAdminPointHistoryDto
   * @return Promise<insertResult>
   * */
  async processFindAllByMemberId(memberId: number, searchAdminPointHistoryDto: SearchAdminPointHistoryDto) {
    if (searchAdminPointHistoryDto.getTake() < 20) {
      searchAdminPointHistoryDto.limitSize = 20;
    }

    const total = await this.adminPointHistoryRepository.count(memberId);
    const items = await this.adminPointHistoryRepository.findAllByMemberId(memberId, searchAdminPointHistoryDto);

    const pageNo = searchAdminPointHistoryDto.pageNo;
    const limitSize = searchAdminPointHistoryDto.limitSize;

    return new Page(pageNo, total, limitSize, items);
  }

  /**
   * 후기 기준 포인트 히스토리 upsert 처리
   */
  public async upsert(memberId: number, dto: UpdateAdminPointDto, reviewId: number) {
    const existing = await this.adminPointHistoryRepository.findMember(memberId, reviewId);
    console.log('여기니????????????????????', dto);
    if (existing) {
      existing.newPoint = dto.newPoint;
      existing.pointType = dto.pointType;
      existing.updatedDate = new Date();
      console.log('existing????????????????????', existing);

      await this.adminPointHistoryRepository.saveHistory(existing);
      return true;
    } else {
      console.log('재밌나ㅣ????????????????????', existing);

      const newHistory = this.adminPointHistoryRepository.createAndSaveHistory(memberId, reviewId, dto);
      return true;
    }
  }
}

/** 
 
  public async upsert(memberId: number, dto: UpdateAdminPointDto, reviewId: number) {
    const existing = await this.adminPointHistoryRepository.findMember(memberId, reviewId);
    console.log('여기니????????????????????', dto);
    if (existing) {
      existing.newPoint = dto.newPoint;
      existing.pointType = dto.pointType;
      existing.updatedDate = new Date();
      console.log('existing????????????????????', existing);

      await this.adminPointHistoryRepository.saveHistory(existing);
      return true;
    } else {
      console.log('dto :::::::::::::::;', dto);

      const newHistory = new PointHistory();
      newHistory.member.memberId = memberId;
      newHistory.review.reviewId = reviewId;
      newHistory.newPoint = dto.newPoint;
      newHistory.pointType = dto.pointType;

      await this.adminPointHistoryRepository.saveHistory(newHistory);
      return true;
    }
  }
}


*/
