import { Inject, Injectable } from '@nestjs/common';
import { UpdateAdminPointDto } from './model/update-admin-point.dto';
import { AdminPointRepository } from './admin-point.repository';
import { AdminPointHistoryService } from '../admin-point-history/admin-point-history.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AdminPointService {
  constructor(
    @Inject() private adminPointRepository: AdminPointRepository,
    @Inject() private adminPointHistoryService: AdminPointHistoryService,
  ) {}

  /**
   * 포인트 적립/회수 메서드
   * @param pointFlag
   * @param memberId
   * @param updateAdminPointDto
   * */
  @Transactional()
  async saveRecallPoint(pointFlag: string, memberId: number, updateAdminPointDto: UpdateAdminPointDto, reviewId: number) {
    if (pointFlag === 'save') {
      const savePointDto = updateAdminPointDto.toSavePointDto();
      if (savePointDto.newPoint < 1) throw new Error('적립 포인트는 0보다 더 큰 수만 가능합니다.');
      return await this.processInsertUpdatePoint(pointFlag, memberId, savePointDto, reviewId);
    }

    const recallPointDto = updateAdminPointDto.toRecallPointDto();
    if (recallPointDto.newPoint > -1) throw new Error('회수 포인트는 0보다 더 작은 수만 가능합니다.');
    return await this.processInsertUpdatePoint(pointFlag, memberId, recallPointDto, reviewId);
  }

  /**
   * 포인트 적립/회수 프로세스
   * @param pointFlag
   * @param memberId
   * @param updateAdminPointDto
   * @param reviewId
   * */
  @Transactional()
  public async processInsertUpdatePoint(pointFlag: string, memberId: number, updateAdminPointDto: UpdateAdminPointDto, reviewId: number) {
    // 멤버로 생성된 포인트 정보가 있는지 확인
    const point = await this.adminPointRepository.findOneByMemberId(memberId);
    let pointResult: boolean = false;

    if (pointFlag === 'recall' && (point == null || point.totalPoint < updateAdminPointDto.newPoint * -1)) {
      throw new Error('대상자의 보유 포인트가 부족해 포인트 회수에 실패했습니다.');
    }
    // 포인트 정보가 null 이면 포인트 정보를 합산하여 생성
    else if (point == null) {
      pointResult = await this.adminPointRepository.insert(memberId, updateAdminPointDto.newPoint);
    }
    // 아니면 합산된 totalPoint 로 point 수정
    else {
      const totalPoint = point.totalPoint + updateAdminPointDto.newPoint;
      pointResult = await this.adminPointRepository.update(memberId, totalPoint);
    }

    const pointHistoryResult = await this.adminPointHistoryService.insert(memberId, updateAdminPointDto, reviewId);
    // PointHistory 에 신규 포인트 내역 적재
    return pointResult && pointHistoryResult;
  }

  /**
   * 후기 작성 시 포인트 지급 및 히스토리 upsert 처리
   */
  @Transactional()
  public async processUpsertPointByReview(memberId: number, updateAdminPointDto: UpdateAdminPointDto, reviewId: number) {
    const point = await this.adminPointRepository.findOneByMemberId(memberId);
    let pointResult: boolean = false;
    if (isNaN(updateAdminPointDto.newPoint) || updateAdminPointDto.newPoint === null || updateAdminPointDto.newPoint === undefined) {
      console.log('오류발생');
    }
    if (!point) {
      pointResult = await this.adminPointRepository.insert(memberId, updateAdminPointDto.newPoint);
    } else {
      const totalPoint = point.totalPoint + updateAdminPointDto.newPoint;
      pointResult = await this.adminPointRepository.update(memberId, totalPoint);
    }

    await this.adminPointHistoryService.upsert(memberId, updateAdminPointDto, reviewId);

    return pointResult;
  }
}
