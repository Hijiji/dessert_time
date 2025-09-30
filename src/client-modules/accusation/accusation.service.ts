import { Injectable } from '@nestjs/common';
import { PostAccusationDto } from './dto/post.accusation.dto';
import { AccusationRecordDto } from './dto/accusation.record.dto';
import { AccusationRepository } from './accusation.repository';
import { AccusationEnum } from '../../common/enum/accusation.enum';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AccusationService {
  constructor(private accusationRepository: AccusationRepository) {}

  /**
   * 신고 사유 목록 조회
   */
  @Transactional()
  async getAccuList() {
    const result = Object.entries(AccusationEnum).map(([key, value]) => ({
      code: key,
      text: value,
    }));
    return result;
  }

  /**
   * 신고 등록
   * @param postAccusationDto
   * @returns
   */
  @Transactional()
  async postAccusation(postAccusationDto: PostAccusationDto) {
    await this.accusationRepository.insertAccusation(postAccusationDto);
    const count = await this.accusationRepository.countAccusation(postAccusationDto);
    if (count >= 3) await this.accusationRepository.updateReview(postAccusationDto.reviewId);

    //todo
    //신고하기 누른 사용자가 올린 모든 리뷰 조회 못하게 막기
    //완료 : table 하나 생성 - 사용자별 차단 유저 관리 테이블
    //리뷰 조회 API마다 사용자 ID로 차단된 사용자들의 리뷰는 조회되지 못하게 수정필요
  }

  /**
   * 사용자,리뷰가 동일한 신고기록있는지 확인
   * @param accusationRecordDto
   * @returns
   */
  @Transactional()
  async getPreAccuRecord(accusationRecordDto: AccusationRecordDto) {
    let isPreAccuRecord = false;

    const preAccusation = await this.accusationRepository.findPreAccuRecord(accusationRecordDto);
    if (preAccusation) isPreAccuRecord = true;
    return { isPreAccuRecord };
  }
}
