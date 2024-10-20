import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { MemberRepository } from './member.repository';
import { Transactional } from 'typeorm-transactional';
import { UserValidationDto } from './dto/login.dto';
import { MemberIdDto } from './dto/member.id';
import { MemberDeletionEnum } from './enum/member.deletion.enum';
import { MemberDeleteDto } from './dto/member.delete.dto';
import { MemberAlarmDto } from './dto/member.alarm.dto';
import { MemberAdDto } from './dto/member.add.dto';
import { NoticeListDto } from './dto/notice.list.dto';
import { NoticeDto } from './dto/notice.dto';
import { NickNameDto } from './dto/nickname.dto';
import { MemberUpdateDto } from './member.update.dto';
import { Member } from 'src/config/entities/member.entity';

@Injectable()
export class MemberService {
  constructor(private memberRepository: MemberRepository) {}

  /**
   * 회원가입
   * @param signInDto
   */
  @Transactional()
  async memberSignIn(signInDto: SignInDto) {
    try {
      const isEmail = await this.memberRepository.findEmailOne(signInDto.memberEmail);
      const isSnsId = await this.memberRepository.findSnsIdOne(signInDto.snsId);

      if (!isEmail && !isSnsId) {
        await this.memberRepository.insertMember(signInDto);
      } else {
        throw new BadRequestException('중복정보', {
          cause: new Error(),
          description: '이미 등록된 사용자입니다.',
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자 유효성검사
   * @param userValidationDto
   * @returns
   */
  @Transactional()
  async memberValidate(userValidationDto: UserValidationDto) {
    try {
      const memberData = await this.memberRepository.memberValidate(userValidationDto);
      if (!memberData) {
        throw new BadRequestException('미등록정보', {
          cause: new Error(),
          description: '가입되지않은 정보입니다.',
        });
      }
      return memberData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * 마이페이지 첫화면 (리뷰 수, 밀 수, 닉네임)
   * @param memberIdDto
   * @returns
   */
  @Transactional()
  async myPageOverview(memberIdDto: MemberIdDto) {
    try {
      const nickName = await this.memberRepository.findUserNickNameOne(memberIdDto);
      const usersReviewCount = await this.memberRepository.countReview(memberIdDto);
      const usersTotalPoint = await this.memberRepository.findTotalPointOne(memberIdDto);
      return {
        nickName: nickName.nickName,
        usersReviewCount,
        usersTotalPoint: usersTotalPoint[0].totalPoint,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   * @param memberIdDto
   * @returns
   */
  @Transactional()
  async getMemberOne(memberIdDto: MemberIdDto) {
    try {
      const memberData = await this.memberRepository.findMemberOne(memberIdDto);
      const groupByMemberId = (memberData) => {
        return memberData.reduce((acc, current) => {
          // 이미 존재하는 memberId인지 확인
          const existingMember = acc.find((item) => item.memberId === current.memberId);

          if (existingMember) {
            // 같은 memberId가 있을 경우 dessertCategory와 dessertName을 추가
            existingMember.desserts.push({
              dessertCategoryId: current.dessertCategoryId,
              dessertName: current.dessertName,
            });
          } else {
            // 새로운 memberId일 경우 새로운 객체를 추가
            acc.push({
              memberId: current.memberId,
              gender: current.gender,
              nickName: current.nickName,
              birthYear: current.birthYear,
              firstCity: current.firstCity,
              secondaryCity: current.secondaryCity,
              thirdCity: current.thirdCity,
              profileImgMiddlePath: current.profileImgMiddlePath,
              profileImgId: current.profileImgId,
              profileImgPath: current.profileImgPath,
              profileImgExtension: current.profileImgExtension,
              desserts: [
                {
                  dessertCategoryId: current.dessertCategoryId,
                  dessertName: current.dessertName,
                },
              ],
            });
          }
          return acc;
        }, []);
      };

      const groupedData = groupByMemberId(memberData);
      return groupedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 닉네임 사용여부 확인
   * @param nickNameDto
   * @returns
   */
  @Transactional()
  async isUsableNickName(nickNameDto: NickNameDto) {
    try {
      let result = { usable: true };
      const isUsableNickName = await this.memberRepository.isUsableNickName(nickNameDto);
      if (isUsableNickName.length > 0) result.usable = false;
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자 정보 변경
   * @param memberUpdateDto
   */
  @Transactional()
  async patchMember(memberUpdateDto: MemberUpdateDto) {
    try {
      await this.memberRepository.saveMember(memberUpdateDto);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 광고, 알람 수신 여부 조회
   * @param memberIdDto
   * @returns
   */
  @Transactional()
  async getAlarmAndADStatue(memberIdDto: MemberIdDto) {
    try {
      const { isAgreeAD, isAgreeAlarm } = await this.memberRepository.findAlarmAndADStatue(memberIdDto);
      return {
        isAgreeAD,
        isAgreeAlarm,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 알람 수신여부 업데이트
   * @param memberAlarmDto
   */
  @Transactional()
  async patchAlarmStatus(memberAlarmDto: MemberAlarmDto) {
    try {
      await this.memberRepository.updateAlarm(memberAlarmDto);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 광고 수신여부 업데이트
   * @param memberAdDto
   */
  @Transactional()
  async patchAdStatus(memberAdDto: MemberAdDto) {
    try {
      await this.memberRepository.updateAd(memberAdDto);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 신고 사유 조회
   * @returns
   */
  @Transactional()
  async getReasonForLeaving() {
    try {
      return MemberDeletionEnum;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용자 탈퇴하기
   * @param memberDeleteDto
   */
  @Transactional()
  async deleteMember(memberDeleteDto: MemberDeleteDto) {
    try {
      //탈퇴 사유 업ㄷㅔ이트, 닉네임 변경, 이름/이메일/snsId/snsdomain 데이터 변경, 탈퇴여부 변경
    } catch (error) {
      throw error;
    }
  }

  /**
   * 이번달에 쌓은 포인트점수
   * @param memberIdDto
   * @returns
   */
  @Transactional()
  async getPoint(memberIdDto: MemberIdDto) {
    try {
      const thisMonthPointData = await this.memberRepository.findThisMonthPoint(memberIdDto);
      const totalPoint = await this.memberRepository.findTotalPointOne(memberIdDto);
      const thisMonthPoint = !thisMonthPointData.totalPoint ? 0 : thisMonthPointData.totalPoint;

      const result = {
        thisMonthPoint,
        totalPoint: totalPoint[0].totalPoint,
      };
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 보유밀 상세내역
   * @param memberIdDto
   */
  @Transactional()
  async getPointHisoryList(memberIdDto: MemberIdDto) {
    try {
      const pointHistoryList = await this.memberRepository.findPointHisoryList(memberIdDto);
      const result = pointHistoryList.map((data) => {
        const createdDate: string = data.createdDate.toISOString().substring(0, 10);
        return {
          menuName: data.review?.menuName,
          point: data.newPoint,
          createdDate,
        };
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 공지/이벤트 목록조회
   * @param noticeListDto
   * @returns
   */
  @Transactional()
  async getNoticeList(noticeListDto: NoticeListDto) {
    try {
      const result = await this.memberRepository.findNoticeList(noticeListDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 공지/이벤트 하나 조회
   * @param noticeDto
   * @returns
   */
  @Transactional()
  async getNoticeOne(noticeDto: NoticeDto) {
    try {
      const result = await this.memberRepository.findNoticeOne(noticeDto);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
