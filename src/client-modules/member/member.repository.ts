import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'src/config/entities/member.entity';
import { In, Repository } from 'typeorm';
import { UserValidationDto } from './dto/login.dto';
import { SignInDto } from './dto/signin.dto';
import { Review } from 'src/config/entities/review.entity';
import { MemberIdDto } from './dto/member.id';
import { Point } from 'src/config/entities/point.entity';
import { MemberAlarmDto } from './dto/member.alarm.dto';
import { MemberAdDto } from './dto/member.add.dto';
import { PointHistory } from 'src/config/entities/point.history.entity';
import { Notice } from 'src/config/entities/notice.entity';
import { NoticeListDto } from './dto/notice.list.dto';
import { NoticeDto } from './dto/notice.dto';
import { ProfileImg } from 'src/config/entities/profile.img.entity';
import { UserInterestDessert } from 'src/config/entities/user.interest.dessert.entity';
import { DessertCategory } from 'src/config/entities/dessert.category.entity';
import { NickNameDto } from './dto/nickname.dto';
import { MemberUpdateDto } from './member.update.dto';

@Injectable()
export class MemberRepository {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Point)
    private pointRepository: Repository<Point>,
    @InjectRepository(PointHistory)
    private pointHistory: Repository<PointHistory>,
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
  ) {}

  /**
   * 회원가입시 사용자 검사
   * @param loginDto
   * @returns
   */
  async findEmailOne(memberEmail: string) {
    return await this.memberRepository.findOne({
      select: {
        memberId: true,
        memberEmail: true,
      },
      where: { memberEmail },
    });
  }

  /**
   * 회원가입시 사용자 검사
   * @param loginDto
   * @returns
   */
  async findSnsIdOne(snsId: string) {
    return await this.memberRepository.findOne({
      select: {
        memberId: true,
        memberEmail: true,
      },
      where: { snsId },
    });
  }

  /**
   * 사용자 로그인시도시 유효성 검사
   * @param loginDto
   * @returns
   */
  async memberValidate(userValidationDto: UserValidationDto) {
    return await this.memberRepository.findOne({
      where: { snsId: userValidationDto.snsId },
    });
  }

  /**
   * 회원가입
   * @param email
   * @returns
   */
  async insertMember(signInDto: SignInDto) {
    return await this.memberRepository.insert({
      snsId: signInDto.snsId,
      memberName: signInDto.memberName,
      memberEmail: signInDto.memberEmail,
      signInSns: signInDto.signInSns,
      birthYear: signInDto.birthYear,
      gender: signInDto.memberGender,
      firstCity: signInDto.firstCity,
      secondaryCity: signInDto.secondaryCity,
      thirdCity: signInDto.thirdCity,
      isAgreeAD: signInDto.isAgreeAD,
      nickName: Math.ceil(Math.random() * 1000) + ' 번째 테스트 닉네임 어흥',
    });
  }

  /**
   * 사용자 닉네임 조회
   * @param memberIdDto
   * @returns
   */
  async findUserNickNameOne(memberIdDto: MemberIdDto) {
    return await this.memberRepository.findOne({ select: { nickName: true }, where: { memberId: memberIdDto.memberId } });
  }

  /**
   * 사용자정보 조회
   * @param memberIdDto
   * @returns
   */
  async findMemberOne(memberIdDto: MemberIdDto) {
    return await this.memberRepository
      .createQueryBuilder('m')
      .leftJoin(ProfileImg, 'profileImg', 'profileImg.memberMemberId = m.memberId') // 프로필 이미지와의 JOIN
      .leftJoin(UserInterestDessert, 'uids', 'uids.memberMemberId = m.memberId') // user_interest_dessert와의 JOIN
      .leftJoin(DessertCategory, 'dc', 'dc.dessertCategoryId = uids.dcDessertCategoryId') // dessert_category와의 JOIN
      .select([
        'm.memberId AS "memberId"',
        'm.gender AS "gender"',
        'm.nickName AS "nickName"',
        'm.birthYear AS "birthYear"',
        'm.firstCity AS "firstCity"',
        'm.secondaryCity AS "secondaryCity"',
        'm.thirdCity AS "thirdCity"',
        'profileImg.middlePath AS "profileImgMiddlePath"',
        'profileImg.profileImgId AS "profileImgId"',
        'profileImg.path AS "profileImgPath"',
        'profileImg.extension AS "profileImgExtension"',
        'dc.dessertCategoryId AS "dessertCategoryId"',
        'dc.dessertName AS "dessertName"',
      ])
      .where('m.memberId = :memberId', { memberId: memberIdDto.memberId }) // 특정 회원 ID 조건
      .getRawMany();
  }

  /**
   * 닉네임 존재여부 확인
   * @param nickNameDto
   */
  async isUsableNickName(nickNameDto: NickNameDto) {
    return await this.memberRepository.find({ select: { nickName: true }, where: { nickName: nickNameDto.nickName } });
  }

  /**
   * 사용자가 작성한 리뷰 카운트
   * @param memberIdDto
   * @returns
   */
  async countReview(memberIdDto: MemberIdDto) {
    return await this.reviewRepository.count({ where: { member: { memberId: memberIdDto.memberId } } });
  }

  /**
   * 보유 밀
   * @param memberIdDto
   * @returns
   */
  async findTotalPointOne(memberIdDto: MemberIdDto) {
    return await this.pointRepository.find({ select: { totalPoint: true }, where: { member: { memberId: memberIdDto.memberId } } });
  }

  /**
   * 알람 및 광고 수신여부 조회
   * @param memberIdDto
   * @returns
   */
  async findAlarmAndADStatue(memberIdDto: MemberIdDto) {
    return await this.memberRepository.findOne({ select: { isAgreeAD: true, isAgreeAlarm: true }, where: { memberId: memberIdDto.memberId } });
  }

  /**
   * 알람 수신여부 변경
   * @param memberAlarmDto
   */
  async updateAlarm(memberAlarmDto: MemberAlarmDto) {
    await this.memberRepository.update({ memberId: memberAlarmDto.memberId }, { isAgreeAlarm: memberAlarmDto.alarmStatus });
  }

  /**
   * 광고 수신여부 변경
   * @param memberAdDto
   */
  async updateAd(memberAdDto: MemberAdDto) {
    await this.memberRepository.update({ memberId: memberAdDto.memberId }, { isAgreeAD: memberAdDto.adStatus });
  }

  /**
   * 이번달 포인트 조회
   * @param memberIdDto
   * @returns
   */
  async findThisMonthPoint(memberIdDto: MemberIdDto) {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // 이번 달의 첫 날
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // 이번 달의 마지막 날

    return await this.pointHistory
      .createQueryBuilder('ph')
      .select('SUM(ph.newPoint)', 'totalPoint')
      .leftJoin(Member, 'm', 'ph.memberMemberId = m.memberId')
      .where('m.memberId = :memberId', { memberId: memberIdDto.memberId })
      .andWhere('ph.createdDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();
  }

  /**
   * 보유밀 상세내역
   * @param memberIdDto
   * @returns
   */
  async findPointHisoryList(memberIdDto: MemberIdDto) {
    return await this.pointHistory.find({
      select: { createdDate: true, newPoint: true },
      relations: ['review'],
      where: { member: { memberId: memberIdDto.memberId } },
      order: { createdDate: 'DESC' },
    });
  }

  /**
   * 공지/이벤트 목록 조회
   * @param noticeListDto
   * @returns
   */
  async findNoticeList(noticeListDto: NoticeListDto) {
    return await this.noticeRepository.find({
      select: { title: true, createdDate: true, noticeId: true },
      where: { isNotice: noticeListDto.isNotice },
      order: { createdDate: 'DESC' },
    });
  }

  /**
   * 공지/이벤트 하나 조회
   * @param noticeDto
   * @returns
   */
  async findNoticeOne(noticeDto: NoticeDto) {
    return await this.noticeRepository.findOne({ select: { content: true, title: true, createdDate: true }, where: { noticeId: noticeDto.noticeId, isNotice: noticeDto.isNotice } });
  }

  /**
   * 사용자 정보 수정하기
   * @param memberUpdateDto
   * @returns
   */
  async saveMember(memberUpdateDto: MemberUpdateDto) {
    return await this.memberRepository.update(
      { memberId: memberUpdateDto.memberId },
      {
        birthYear: memberUpdateDto.birthYear,
        gender: memberUpdateDto.gender,
        firstCity: memberUpdateDto.firstCity,
        secondaryCity: memberUpdateDto.secondaryCity,
        thirdCity: memberUpdateDto.thirdCity,
        nickName: memberUpdateDto.nickName,
      },
    );
  }
}
