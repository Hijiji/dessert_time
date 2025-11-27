import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from './member.service';
import { MemberRepository } from './member.repository';
import { AuthService } from 'src/config/auth/auth.service';
import { FileTransService } from 'src/config/file/filetrans.service';
import { initializeTransactionalContext } from 'typeorm-transactional-cls-hooked';
import { Member } from 'src/config/entities/member.entity';
import { addAbortListener } from 'events';
import { SignInDto } from './dto/signin.dto';
import { InsertResult } from 'typeorm';
import { UserValidationDto } from './dto/login.dto';
import { BadRequestException } from '@nestjs/common';

initializeTransactionalContext();
jest.mock('typeorm-transactional', () => ({
  Transactional: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => descriptor,
}));
describe('MemberService', () => {
  let service: MemberService;
  let repository: jest.Mocked<MemberRepository>;
  let authService: jest.Mocked<AuthService>;
  let fileService: jest.Mocked<FileTransService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: MemberRepository,
          useValue: {
            findEmailOne: jest.fn(),
            findSnsIdOne: jest.fn(),
            insertMember: jest.fn(),
            updateMemberNickname: jest.fn(),
            insertPickCategoryList: jest.fn(),
            findSnsId: jest.fn(),
            memberValidate: jest.fn(),
            //:jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: { jwtLogIn: jest.fn() },
        },
        {
          provide: FileTransService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    repository = module.get(MemberRepository);
    authService = module.get(AuthService);
    fileService = module.get(FileTransService);
  });

  /**
   * 회원가입 정책
   * 1. 회원가입 요청온 이메일/sns이 이미 등록되어있으면 BadRequestException 반환
   * 2. 등록되지않은 정보일경우
   *    1. 사용자 정보 저장
   *    2. 닉네임 업데이트
   *    3. 선호하는 디저트카테고리 등록
   *    4. snsId 반환
   */
  describe('memberSignIn', () => {
    let dto: SignInDto = {
      memberEmail: 'aa@abc.com',
      snsId: 'testSnsId',
      memberPickCategory1: 1,
      memberPickCategory2: 2,
    } as SignInDto;

    it('회원가입 정상동작 확인', async () => {
      //Arrange
      const newMember: InsertResult = {
        identifiers: [{ memberId: 2 }],
        generatedMaps: [{ memberId: 2 }],
        raw: { memberId: 2 },
      } as InsertResult;
      const newMemberId = newMember.identifiers[0].memberId;
      const nickName = `${newMemberId}번째 달콤한 디저트`;

      repository.findEmailOne.mockResolvedValue(null);
      repository.findSnsIdOne.mockResolvedValue(null);
      repository.insertMember.mockResolvedValue(newMember);
      repository.findSnsId.mockResolvedValue({ snsId: 'testSnsId' } as Member);

      //Act
      const result = await service.memberSignIn(dto);

      //Assert
      expect(repository.findEmailOne).toHaveBeenCalledWith(dto.memberEmail);
      expect(repository.findSnsIdOne).toHaveBeenCalledWith(dto.snsId);
      expect(repository.insertMember).toHaveBeenCalledWith(dto);
      expect(repository.updateMemberNickname).toHaveBeenCalledWith(newMemberId, nickName);
      expect(repository.insertPickCategoryList).toHaveBeenCalled();
      expect(repository.findSnsId).toHaveBeenCalledWith(newMemberId);
      expect(repository.findSnsId).toHaveBeenCalledWith(newMemberId);
      expect(result).toEqual({ snsId: 'testSnsId' } as Member);
    });

    it('이미 존재하는 회원, Exception 발생', async () => {
      //Arrange
      const member: Member = { memberId: 1, memberEmail: 'aa@abc.com' } as Member;
      repository.findEmailOne.mockResolvedValue(member);
      repository.findSnsIdOne.mockResolvedValue(member);
      //Act & Assert
      await expect(service.memberSignIn(dto)).rejects.toThrow(BadRequestException);
      expect(repository.findEmailOne).toHaveBeenCalledWith(dto.memberEmail);
      expect(repository.findSnsIdOne).toHaveBeenCalledWith(dto.snsId);
      expect(repository.insertMember).not.toHaveBeenCalled();
      expect(repository.updateMemberNickname).not.toHaveBeenCalled();
      expect(repository.insertPickCategoryList).not.toHaveBeenCalled();
    });
  });

  /**
   * 사용자 유효성검사 정책
   * 1. 사용자 유효성검사 성공시 사용자ID, nickname, token 반환
   * 2. 등록되지 않은 사용자일 경우 BadRequestException - '가입되지 않은 정보' 반환
   */
  describe('memberValidate', () => {
    const dto: UserValidationDto = { snsId: 'testSnsId' };
    it('사용자 유효성검사 성공case', async () => {
      //Arrange
      const memberData: Member = { snsId: 'testSnsId', isUsable: true, nickName: 'nickName', memberId: 1, memberName: 'test' } as Member;
      const token = { token: '1q2w3e4r' };
      repository.memberValidate.mockResolvedValue(memberData);
      authService.jwtLogIn.mockResolvedValue(token);
      //Act
      const result = await service.memberValidate(dto);
      //Assert
      expect(repository.memberValidate).toHaveBeenCalledWith(dto);
      expect(authService.jwtLogIn).toHaveBeenCalledWith(memberData);
      expect(result).toEqual({ memberId: memberData.memberId, nickName: memberData.nickName, token: token.token });
    });

    it('등록되지 않은 사용자일 경우 BadRequestException 반환', async () => {
      //Arrange
      repository.memberValidate(null);
      //Act and Assert
      await expect(service.memberValidate(dto)).rejects.toThrow(BadRequestException);
      expect(authService.jwtLogIn).not.toHaveBeenCalled();
    });
  });
});
