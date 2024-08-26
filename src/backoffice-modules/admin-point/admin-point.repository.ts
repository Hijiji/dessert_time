import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from '../../config/entities/point.entity';

export class AdminPointRepository {
  constructor(@InjectRepository(Point) private adminPointRepository: Repository<Point>) {}

  /**
   * 회원 번호를 이용한 포인트 검색
   * @param memberId
   * */
  async findOneByMemberId(memberId: number) {
    return await this.adminPointRepository.findOneBy({ member: { memberId: memberId } });
  }

  /**
   * 포인트 업데이트
   * @param memberId
   * @param totalPoint
   * */
  async update(memberId: number, totalPoint: number) {
    await this.adminPointRepository.update({ member: { memberId: memberId } }, { totalPoint: totalPoint });
  }
}
