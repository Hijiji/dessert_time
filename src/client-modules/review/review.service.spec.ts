import { Test, TestingModule } from '@nestjs/testing';
import { AdminPointService } from 'src/backoffice-modules/admin-point/admin-point.service';
import { initializeTransactionalContext } from 'typeorm-transactional-cls-hooked';
import { MemberIdDto } from './dto/member.id.dto';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';
import { ReviewCategoryDto } from './dto/review.category.dto';
import { ReviewMemberIdDto } from './dto/review.member.dto';
import { BadRequestException } from '@nestjs/common';

// 트랜잭션 초기화 : 실제 DB 트랜잭션을 걸지 않고 @Transaction이 동작하도록 준비함. 초기화함수.
initializeTransactionalContext();

// Transactional 무시 : jest에서 mock()을 이용해서 typeorm-transactinal 모듈을 가로채고 Transactional데코레이터를 그냥 원래 함수 그대로 반환하도록 덮어씀.
jest.mock('typeorm-transactional', () => ({
  Transactional: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => descriptor,
}));

describe('ReviewService', () => {
  let service: ReviewService;
  let repository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: ReviewRepository,
          useValue: {
            findMemberInterestList: jest.fn(),
            findUsablecategoryList: jest.fn(),
            findReviewImgList: jest.fn(),
            findRandomCategoryList: jest.fn(),
            findRandomReviewImgList: jest.fn(),
            findReviewCategoryList: jest.fn(),
            findReviewOne: jest.fn(),
          },
        },
        {
          provide: AdminPointService,
          useValue: {
            processUpsertPointByReview: jest.fn(), // ReviewService 안에서 실제 호출하는 메소드 이름에 맞게
          },
        },
      ],
    }).compile(); //compile() : 위 내용으로 test module 생성

    //test용 module에서 실제 service인스턴스를 가져옴
    service = module.get<ReviewService>(ReviewService);
    repository = module.get(ReviewRepository);
  });

  describe('getHomeReviewImgList', () => {
    //test case 작성
    it('memberId가 없으면 random category만 조회한다', async () => {
      //test이기 때문에 as 사용. 내가 보장할게~ 믿어줘 ~ 컴파일러야~ 타입검사를 강제로 건너뜀
      const dto = { memberId: null } as MemberIdDto;

      //repository mock, mockResolvedValue : promise 반환 -> await 가능!
      repository.findRandomCategoryList.mockResolvedValue([{ dc_dessertCategoryId: 1, dc_dessertName: '쿠키' }]);
      repository.findRandomReviewImgList.mockResolvedValue([{ reviewId: 10 }]);

      const result = await service.getHomeReviewImgList(dto);

      //findMemberInterestList 함수가 한번도 호출되지 않았는지 확인.
      expect(repository.findMemberInterestList).not.toHaveBeenCalled();
      //findRandomCategoryList 함수가 25라는 인자로 호출되었는지 확인
      expect(repository.findRandomCategoryList).toHaveBeenCalledWith(25);
      //service 호출 결과와 예상결과가 일치하는지 확인
      expect(result).toEqual([{ dessertCategoryId: 1, dessertName: '쿠키', categoryReviewImgList: [{ reviewId: 10 }] }]);
    });

    it('usableCategoryList가 있으면 reviewImgList에 포함한다.', async () => {
      const dto = { memberId: 1 } as MemberIdDto;

      repository.findMemberInterestList.mockResolvedValue([{ dc_dessertCategoryId: 2 }]);
      repository.findUsablecategoryList.mockResolvedValue([{ dc_dessertCategoryId: 5, dc_dessertName: '쿠키' } as any]);
      repository.findReviewImgList.mockResolvedValue([{ reviewId: 100 }]);
      repository.findRandomCategoryList.mockResolvedValue([]);
      repository.findRandomReviewImgList.mockResolvedValue([]);

      const result = await service.getHomeReviewImgList(dto);

      expect(result).toEqual([{ dessertCategoryId: 5, dessertName: '쿠키', categoryReviewImgList: [{ reviewId: 100 }] }]);
    });
  });

  it('interestList가 있지만 usableCategoryList가 없으면 랜덤조회한다', async () => {
    const dto: MemberIdDto = { memberId: 1 };
    repository.findMemberInterestList.mockResolvedValue([{ dc_dessertCategoryId: 2 }]);
    repository.findUsablecategoryList.mockResolvedValue([]);
    repository.findRandomCategoryList.mockResolvedValue([{ dc_dessertCategoryId: 3, dc_dessertName: '파이' }]);
    repository.findRandomReviewImgList.mockResolvedValue([{ reviewId: 20 }]);

    const result = await service.getHomeReviewImgList(dto);

    expect(repository.findMemberInterestList).toHaveBeenCalled();
    expect(repository.findUsablecategoryList).toHaveBeenCalled();
    expect(result).toEqual([{ dessertCategoryId: 3, dessertName: '파이', categoryReviewImgList: [{ reviewId: 20 }] }]);
  });

  it('repository 에러 발생시 throw', async () => {
    //의도적 Promise error 발생
    repository.findRandomCategoryList.mockRejectedValue(new Error('db error'));

    //rejects된 값이 dberror이야? 웅
    await expect(service.getHomeReviewImgList({ memberId: null } as MemberIdDto)).rejects.toThrow('db error');
  });

  describe('findReviewCategoryList', () => {
    it('repository가 빈 배열을 리텅하면 빈 pagination을 리턴한다', async () => {
      const dto: ReviewCategoryDto = { dessertCategoryId: 10, selectedOrder: 'L', memberId: 1, limit: 30 };

      repository.findReviewCategoryList.mockResolvedValue([]);

      const result = await service.findReviewCategoryList(dto);

      expect(result).toEqual({ items: [], hasNextPage: false, nextCursor: null });
    });

    it('같은 reviewId를 가진 ingredient, reviewImg, profileimg가 중복되면 삭제한다.', async () => {
      const dto: ReviewCategoryDto = { dessertCategoryId: 10, selectedOrder: 'L', memberId: 1, limit: 30 };

      repository.findReviewCategoryList.mockResolvedValue([
        {
          reviewId: 1,
          totalLikedNum: 5,
          menuName: 'Cake',
          content: 'Good',
          storeName: 'Cafe',
          score: 4,
          createdDate: new Date('2025-09-15T00:00:00Z'),
          dessertCategoryId: 10,
          memberNickName: 'UserA',
          memberIsHavingImg: true,
          isLiked: 1,
          ingredientName: 'a',
          reviewImgPath: 'c',
          reviewImgIsMain: '',
          reviewImgNum: '',
          reviewImgMiddlepath: '',
          reviewImgExtention: '',
          PROFILEIMGPATH: 'a',
          PROFILEIMGMIDDLEPATH: '',
          PROFILEIMGEXTENTION: '',
        },
        {
          reviewId: 1,
          totalLikedNum: 5,
          menuName: 'Cake',
          content: 'Good',
          storeName: 'Cafe',
          score: 4,
          createdDate: new Date('2025-09-15T00:00:00Z'),
          dessertCategoryId: 10,
          memberNickName: 'UserA',
          memberIsHavingImg: true,
          isLiked: 1,
          ingredientName: 'b',
          reviewImgPath: 'a',
          reviewImgIsMain: '',
          reviewImgNum: '',
          reviewImgMiddlepath: '',
          reviewImgExtention: '',
          PROFILEIMGPATH: 'a',
          PROFILEIMGMIDDLEPATH: '',
          PROFILEIMGEXTENTION: '',
        },
      ]);

      const result = await service.findReviewCategoryList(dto);
      expect(result).toEqual({
        hasNextPage: false,
        nextCursor: null,
        items: [
          {
            reviewId: 1,
            totalLikedNum: 5,
            menuName: 'Cake',
            content: 'Good',
            storeName: 'Cafe',
            score: 4,
            createdDate: expect.any(Date),
            dessertCategoryId: 10,
            memberNickName: 'UserA',
            memberIsHavingImg: true,
            isLiked: 1,
            ingredient: [{ ingredientName: 'a' }, { ingredientName: 'b' }],
            reviewImg: [
              { reviewImgPath: 'c', reviewImgIsMain: '', reviewImgNum: '', reviewImgMiddlepath: '', reviewImgExtention: '' },
              { reviewImgPath: 'a', reviewImgIsMain: '', reviewImgNum: '', reviewImgMiddlepath: '', reviewImgExtention: '' },
            ],
            profileImg: [{ profileImgPath: 'a', profileImgMiddlePath: '', profileImgExtention: '' }],
          },
        ],
      });
    });
  }); //describe 종료

  /**
   * 정책
   * 1. reviewId를 받으면, 하나의 review를 조회한다.
   * 2. 재료와 이미지파일은 중복되지 않게한다.
   * 3. 존재하지 않는 reviewId를 조회할 때 400오류 발생 및 메세지전달
   */
  describe('findReviewOne', () => {
    it('reviewId를 받으면, 하나의 review를 조회한다.', async () => {
      const dto: ReviewMemberIdDto = { reviewId: 15, memberId: 7 };

      //Arrange - 레포지토리 응답 값 생성
      repository.findReviewOne.mockResolvedValue([
        {
          reviewId: 15,
          totalLikedNum: 42,
          menuName: '딸기 크림 케이크',
          content: '생크림이 부드럽고 딸기 향이 진해요.',
          storeName: '스위트베리카페',
          score: 4.5,
          createdDate: new Date('2025-10-20T00:00:00Z'),
          dessertCategoryId: 3,

          memberNickName: '달콤이',
          memberId: 7,
          memberIsHavingImg: true,

          PROFILEIMGMIDDLEPATH: '/profiles/2025/10/',
          PROFILEIMGPATH: '7_profile',
          PROFILEIMGEXTENTION: '.jpg',

          reviewImgIsMain: true,
          reviewImgNum: 1,
          reviewImgMiddlepath: '/reviews/2025/10/',
          reviewImgPath: '15_1',
          reviewImgExtention: '.png',

          ingredientName: '딸기',
          isLiked: 1,
        },
        {
          reviewId: 15,
          totalLikedNum: 42,
          menuName: '딸기 크림 케이크',
          content: '생크림이 부드럽고 딸기 향이 진해요.',
          storeName: '스위트베리카페',
          score: 4.5,
          createdDate: new Date('2025-10-20T00:00:00Z'),
          dessertCategoryId: 3,

          memberNickName: '달콤이',
          memberId: 7,
          memberIsHavingImg: true,

          PROFILEIMGMIDDLEPATH: '/profiles/2025/10/',
          PROFILEIMGPATH: '7_profile',
          PROFILEIMGEXTENTION: '.jpg',

          reviewImgIsMain: false,
          reviewImgNum: 2,
          reviewImgMiddlepath: '/reviews/2025/10/',
          reviewImgPath: '15_2',
          reviewImgExtention: '.png',

          ingredientName: '생크림',
          isLiked: 1,
        },
      ]);

      //Act - service.findReviewOne()
      const result = await service.findReviewOne(dto);

      //Assert - expect()...
      expect(result).toEqual({
        reviewId: 15,
        totalLikedNum: 42,
        menuName: '딸기 크림 케이크',
        content: '생크림이 부드럽고 딸기 향이 진해요.',
        storeName: '스위트베리카페',
        score: 4.5,
        createdDate: new Date('2025-10-20T00:00:00Z'),
        dessertCategoryId: 3,

        memberNickName: '달콤이',
        memberId: 7,
        memberIsHavingImg: true,

        profileImgMiddlePath: '/profiles/2025/10/',
        profileImgPath: '7_profile',
        profileImgExtension: '.jpg',
        isLiked: 1,

        reviewImg: [
          {
            reviewImgIsMain: true,
            reviewImgNum: 1,
            reviewImgMiddlepath: '/reviews/2025/10/',
            reviewImgPath: '15_1',
            reviewImgExtention: '.png',
          },
          {
            reviewImgIsMain: false,
            reviewImgNum: 2,
            reviewImgMiddlepath: '/reviews/2025/10/',
            reviewImgPath: '15_2',
            reviewImgExtention: '.png',
          },
        ],
        ingredients: ['딸기', '생크림'],
      });
    }); //it 종료

    it('존재하지 않는 reviewId를 조회할 때 오류 발생', async () => {
      const dto: ReviewMemberIdDto = { reviewId: 4512142412124, memberId: 2 };
      //Arrange
      repository.findReviewOne.mockResolvedValue([]);
      //Act + Assert
      //await를 먼저 사용하면 service.findReviewOne(dto)에서 이미 예외가 던져지고, 테스트 코드 자체에서 즉시 throw됨 ! 한번에 써야함
      await expect(service.findReviewOne(dto)).rejects.toThrow(BadRequestException);
    }); //it 종료

    it('재료와 이미지파일은 중복되지 않게한다.', async () => {
      const dto: ReviewMemberIdDto = { reviewId: 15, memberId: 7 };

      //Arrange - 레포지토리 응답 값 생성
      repository.findReviewOne.mockResolvedValue([
        {
          reviewId: 15,
          totalLikedNum: 42,
          menuName: '딸기 크림 케이크',
          content: '생크림이 부드럽고 딸기 향이 진해요.',
          storeName: '스위트베리카페',
          score: 4.5,
          createdDate: new Date('2025-10-20T00:00:00Z'),
          dessertCategoryId: 3,

          memberNickName: '달콤이',
          memberId: 7,
          memberIsHavingImg: true,

          PROFILEIMGMIDDLEPATH: '/profiles/2025/10/',
          PROFILEIMGPATH: '7_profile',
          PROFILEIMGEXTENTION: '.jpg',

          reviewImgIsMain: false,
          reviewImgNum: 2,
          reviewImgMiddlepath: '/reviews/2025/10/',
          reviewImgPath: '15_2',
          reviewImgExtention: '.png',

          ingredientName: '딸기',
          isLiked: 1,
        },
        {
          reviewId: 15,
          totalLikedNum: 42,
          menuName: '딸기 크림 케이크',
          content: '생크림이 부드럽고 딸기 향이 진해요.',
          storeName: '스위트베리카페',
          score: 4.5,
          createdDate: new Date('2025-10-20T00:00:00Z'),
          dessertCategoryId: 3,

          memberNickName: '달콤이',
          memberId: 7,
          memberIsHavingImg: true,

          PROFILEIMGMIDDLEPATH: '/profiles/2025/10/',
          PROFILEIMGPATH: '7_profile',
          PROFILEIMGEXTENTION: '.jpg',

          reviewImgIsMain: false,
          reviewImgNum: 2,
          reviewImgMiddlepath: '/reviews/2025/10/',
          reviewImgPath: '15_2',
          reviewImgExtention: '.png',

          ingredientName: '딸기',
          isLiked: 1,
        },
      ]);

      //Act - service.findReviewOne()
      const result = await service.findReviewOne(dto);

      //Assert - expect()...
      expect(repository.findReviewOne).toHaveBeenCalledWith();
      expect(result).toEqual({
        reviewId: 15,
        totalLikedNum: 42,
        menuName: '딸기 크림 케이크',
        content: '생크림이 부드럽고 딸기 향이 진해요.',
        storeName: '스위트베리카페',
        score: 4.5,
        createdDate: new Date('2025-10-20T00:00:00Z'),
        dessertCategoryId: 3,

        memberNickName: '달콤이',
        memberId: 7,
        memberIsHavingImg: true,

        profileImgMiddlePath: '/profiles/2025/10/',
        profileImgPath: '7_profile',
        profileImgExtension: '.jpg',
        isLiked: 1,

        reviewImg: [
          {
            reviewImgIsMain: false,
            reviewImgNum: 2,
            reviewImgMiddlepath: '/reviews/2025/10/',
            reviewImgPath: '15_2',
            reviewImgExtention: '.png',
          },
        ],
        ingredients: ['딸기'],
      });
    }); //it종료
  }); //describe
});
