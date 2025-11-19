import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from './member.service';
import { MemberRepository } from './member.repository';
import { AuthService } from 'src/config/auth/auth.service';
import { FileTransService } from 'src/config/file/filetrans.service';
import { initializeTransactionalContext } from 'typeorm-transactional-cls-hooked';

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
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
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
    it('회원가입 정상동작 확인', async () => {});
    it('이미 존재하는 회원, Exception 발생', async () => {});
  });
});
