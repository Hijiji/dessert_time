import { Test, TestingModule } from '@nestjs/testing';
import { AdminPointService } from 'src/backoffice-modules/admin-point/admin-point.service';
import { initializeTransactionalContext } from 'typeorm-transactional-cls-hooked';
import { MemberIdDto } from './dto/member.id.dto';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';
import { ReviewCategoryDto } from './dto/review.category.dto';
import { ReviewMemberIdDto } from './dto/review.member.dto';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { LikeDto } from './dto/like.dto';
import { Member } from 'src/config/entities/member.entity';
import { Review } from 'src/config/entities/review.entity';
import { Like } from 'src/config/entities/like.entity';
import { ReviewIdDto } from './dto/review.id.dto';
import { Ingredient } from 'src/config/entities/ingredient.entity';
import { AdminPointRepository } from 'src/backoffice-modules/admin-point/admin-point.repository';
import { AdminPointHistoryService } from 'src/backoffice-modules/admin-point-history/admin-point-history.service';
import { AdminPointHistoryRepository } from 'src/backoffice-modules/admin-point-history/admin-point-history.repository';
import { ReviewUpdateDto } from './dto/review.update.dto';
import { ReviewsRequestDto } from './dto/reviews.request.dto';
import { ReviewImgSaveDto } from './dto/reviewimg.save.dto';
import { InsertResult } from 'typeorm';
import { ReviewImgIdDto } from './dto/reviewimg.id.dto';
import { FileTransService } from 'src/config/file/filetrans.service';
import dayjs from 'dayjs';
import { ReviewImg } from 'src/config/entities/review.img.entity';
import { UpdateAdminPointDto } from 'src/backoffice-modules/admin-point/model/update-admin-point.dto';

// 트랜잭션 초기화 : 실제 DB 트랜잭션을 걸지 않고 @Transaction이 동작하도록 준비함. 초기화함수.
initializeTransactionalContext();

// Transactional 무시 : jest에서 mock()을 이용해서 typeorm-transactinal 모듈을 가로채고 Transactional데코레이터를 그냥 원래 함수 그대로 반환하도록 덮어씀.
jest.mock('typeorm-transactional', () => ({
  Transactional: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => descriptor,
}));

describe('ReviewService', () => {
  let service: ReviewService;
  let repository: jest.Mocked<ReviewRepository>;
  let fileService: jest.Mocked<FileTransService>;
  let adminPointService: jest.Mocked<AdminPointService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: FileTransService,
          useValue: {
            generateFilename: jest.fn(),
            upload: jest.fn(),
            delete: jest.fn(),
          },
        },
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
            findMemberId: jest.fn(),
            findReviewId: jest.fn(),
            findLikeId: jest.fn(),
            deleteReviewLike: jest.fn(),
            decrementTotalLikeNum: jest.fn(),
            insertReviewLike: jest.fn(),
            incrementTotalLikeNum: jest.fn(),
            updateReviewStatus: jest.fn(),
            findIngredientList: jest.fn(),
            insertReviewIngredient: jest.fn(),
            updateGenerableReview: jest.fn(),
            findLikedReviewList: jest.fn(),
            countReviewImg: jest.fn(),
            insertReviewImg: jest.fn(),
            deleteReviewImg: jest.fn(),
            findReviewImgId: jest.fn(),
            saveReviewImg: jest.fn(),
            findReviewImg: jest.fn(),
          },
        },
        {
          provide: AdminPointService,
          useValue: {
            saveRecallPoint: jest.fn(),
            processUpsertPointByReview: jest.fn(),
          },
        },
        {
          provide: AdminPointRepository,
          useValue: {
            insert: jest.fn(),
            update: jest.fn(),
          },
        },

        {
          provide: AdminPointHistoryService,
          useValue: {
            upsert: jest.fn(),
          },
        },
        {
          provide: AdminPointHistoryRepository,
          useValue: {
            findMember: jest.fn(),
            saveHistory: jest.fn(),
            createAndSaveHistory: jest.fn(),
          },
        },
      ],
    }).compile(); //compile() : 위 내용으로 test module 생성

    //test용 module에서 실제 service인스턴스를 가져옴
    service = module.get<ReviewService>(ReviewService);
    repository = module.get(ReviewRepository);
    fileService = module.get(FileTransService);
    adminPointService = module.get(AdminPointService);
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
      expect(repository.findReviewOne).toHaveBeenCalledWith(dto);
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

  /**
   * 정책
   * 1. 리뷰가 이미 좋아요되어있으면 -> 좋아요취소
   * 2. 리뷰가 좋아요 눌러있지 않으면 -> 좋아요
   * 3. 리뷰,사용자 정보 없을 경우 BadRequestException
   */
  describe('postLikeItem', () => {
    it('리뷰에 대한 좋아요 취소', async () => {
      //Arrange
      const dto: LikeDto = { memberId: 2, reviewId: 1, isLike: false };
      const member = { memberId: 2 } as Member;
      const review = { reviewId: 1 } as Review;
      const like = { likeId: 1 } as Like;

      repository.findMemberId.mockResolvedValue(member);
      repository.findReviewId.mockResolvedValue(review);
      repository.findLikeId.mockResolvedValue(like);
      repository.deleteReviewLike.mockResolvedValue();
      repository.decrementTotalLikeNum.mockResolvedValue();

      //Act
      const result = await service.postLikeItem(dto);

      //Assert
      expect(repository.deleteReviewLike).toHaveBeenCalledWith(like.likeId);
      expect(repository.decrementTotalLikeNum).toHaveBeenCalledWith(dto);
      expect(repository.insertReviewLike).not.toHaveBeenCalled();
      expect(repository.incrementTotalLikeNum).not.toHaveBeenCalled();
    }); //it

    it('리뷰에 대한 좋아요 남기기', async () => {
      //Arrange
      const dto: LikeDto = { memberId: 2, reviewId: 1, isLike: true };
      const member = { memberId: 2 } as Member;
      const review = { reviewId: 1 } as Review;
      const like = { likeId: 1 } as Like;

      repository.findMemberId.mockResolvedValue(member);
      repository.findReviewId.mockResolvedValue(review);
      repository.insertReviewLike.mockResolvedValue();
      repository.incrementTotalLikeNum.mockResolvedValue();

      //Act
      const result = await service.postLikeItem(dto);

      //Assert
      expect(repository.insertReviewLike).toHaveBeenCalledWith(dto);
      expect(repository.incrementTotalLikeNum).toHaveBeenCalledWith(dto);
      expect(repository.deleteReviewLike).not.toHaveBeenCalled();
      expect(repository.decrementTotalLikeNum).not.toHaveBeenCalled();
    }); //it

    it('리뷰정보 없을경우 오류발생', async () => {
      //Arrange
      const dto: LikeDto = { memberId: 2, reviewId: 1, isLike: true };
      const member = { memberId: 1 } as Member;
      repository.findMemberId.mockResolvedValue(null);
      repository.findMemberId.mockResolvedValue(member);
      //Act, Assert
      await expect(service.postLikeItem(dto)).rejects.toThrow(BadRequestException);
    }); //it

    it('사용자정보 없을경우 오류발생', async () => {
      //Arrange
      const dto: LikeDto = { memberId: 2, reviewId: 1, isLike: true };
      const review = { reviewId: 1 } as Review;
      repository.findReviewId.mockResolvedValue(review);
      repository.findMemberId.mockResolvedValue(null);

      //Act, Assert
      await expect(service.postLikeItem(dto)).rejects.toThrow(BadRequestException);
    }); //it
  }); //describe

  /**
   * 등록된 리뷰 하나 삭제하기
   * 1. 리뷰는 삭제가 아닌 숨김처리
   * 2. 기존 리뷰의 포인트 삭감처리
   */
  describe('deleteReview', () => {
    //Arrange
    const dto = { reviewId: 1, memberId: 2 } as ReviewIdDto;
    const updateAdminPointDto = { newPoint: 5, pointType: 'A' } as UpdateAdminPointDto;

    it('리뷰 삭제-숨김처리 정상동작', async () => {
      //Act
      const result = await service.deleteReview(dto);
      //Assert
      expect(repository.updateReviewStatus).toHaveBeenCalledWith(dto);
    });

    it('삭제시 포인트 삭감 서비스로직 실행여부 확인', async () => {
      //Act
      const result = await service.deleteReview(dto);
      //Assert
      expect(adminPointService.saveRecallPoint).toHaveBeenCalledWith('recall', dto.memberId, updateAdminPointDto, dto.reviewId);
    });
  });

  /**
   * 재료목록 조회하기
   * 1. 전체 목록 정상반환
   * 2. 빈배열 정상 반환
   * 3. 오류발생시 예외던짐
   */
  describe('getIngredientList', () => {
    it('DB에 저장된 재료 전체 목록 조회', async () => {
      const mockIn = [
        { ingredientId: 1, ingredientName: '유제품' },
        { ingredientId: 2, ingredientName: '견과류' },
      ] as Ingredient[];

      repository.findIngredientList.mockResolvedValue(mockIn);

      const result = await service.getIngredientList();

      expect(result).toEqual(mockIn);
    }); //it

    it('빈배열 정상조회', async () => {
      const mockIn = [] as Ingredient[];
      repository.findIngredientList.mockResolvedValue(mockIn);

      const result = await service.getIngredientList();

      expect(result).toEqual(mockIn);
    }); //it

    it('repository오류 반환', async () => {
      repository.findIngredientList.mockRejectedValue(new Error('DB 에러'));

      await expect(service.getIngredientList()).rejects.toThrow(InternalServerErrorException);
    }); //it
  }); //desc

  /**
   * 후기 저장
   * 1. 리뷰 업데이트
   * 2. 리뷰Id 없으면 재료 먼저 저장
   * 3. 5포인트 적립
   */
  describe('patchGenerableReview', () => {
    let dto: ReviewUpdateDto;
    let review: Review;
    let ingredients: number[];
    let expectedSaveData: any[];

    beforeEach(() => {
      // 테스트 간 독립성을 위해 각 객체를 새로 생성
      ingredients = [1, 2];
      review = { reviewId: 1 } as Review;

      dto = {
        memberId: 1,
        reviewId: 1,
        storeName: '온혜화',
        menuName: '치즈케이크',
        dessertCategoryId: 1,
        score: 1,
        ingredientId: ingredients,
        content: '달콤쌉싸름',
        status: 'saved',
      } as ReviewUpdateDto;

      expectedSaveData = [
        { ingredient: { ingredientId: 1 }, review: { reviewId: 1 } },
        { ingredient: { ingredientId: 2 }, review: { reviewId: 1 } },
      ];

      // mock 초기화
      jest.clearAllMocks();

      repository.updateGenerableReview.mockResolvedValue(review);
      repository.insertReviewIngredient.mockResolvedValue(undefined);
      adminPointService.saveRecallPoint.mockResolvedValue(undefined);
    });
    it('리뷰 저장, 재료저장, 포인트 저장 호출되야함', async () => {
      //Act
      const result = await service.patchGenerableReview(dto);
      //Assert
      expect(repository.updateGenerableReview).toHaveBeenCalledWith(dto);
      expect(repository.insertReviewIngredient).toHaveBeenCalledWith(expectedSaveData);
      expect(adminPointService.saveRecallPoint).toHaveBeenCalled();
      expect(result).toEqual({ reviewId: 1 });
    });
    it('재료가 비어있는경우 insertReviewIngredient 호출하지 않음', async () => {
      const newDto = { ...dto, ingredientId: [] };
      //Act
      const result = await service.patchGenerableReview(newDto);

      //Assert
      expect(repository.updateGenerableReview).toHaveBeenCalledWith(newDto);
      expect(repository.insertReviewIngredient).not.toHaveBeenCalled();
      expect(adminPointService.saveRecallPoint).toHaveBeenCalled();
      expect(result).toEqual({ reviewId: 1 });
    });
  });

  /**
   * 사용자가 좋아요한 리뷰목록 조회
   * 1. 최신 작성한 순서로 조회하기
   * 2. 좋아요 많은 순서로 조회하기
   * 3. 좋아요한 리뷰 목록 없으면 빈배열 반환
   * 4. 응답데이터 목록에는 리뷰ID가 중복되지 않음(재료,이미지 중복 X)
   */
  describe('getLikedReviewList', () => {
    beforeEach(() => {});
    it('사용자가 좋아요한 리뷰목록만, 최신으로 작성한 순서로 조회됨', async () => {
      //Arrange
      const dto = { memberId: 1, sort: 'D' } as ReviewsRequestDto;

      const mockingLikedReview = [
        {
          reviewId: 1,
          totalLikedNum: 5,
          menuName: 'Cake',
          content: 'Good',
          storeName: 'Cafe',
          score: 4,
          createdDate: new Date('2025-09-16T00:00:00Z'),
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
          reviewId: 2,
          totalLikedNum: 10,
          menuName: 'PIKE',
          content: '날아라 용가리',
          storeName: 'Cafe용용',
          score: 3,
          createdDate: new Date('2025-09-15T00:00:00Z'),
          dessertCategoryId: 21,
          memberNickName: 'UserB',
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
      ];
      const expectedResult = {
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
            createdDate: new Date('2025-09-16T00:00:00Z'),
            dessertCategoryId: 10,
            memberNickName: 'UserA',
            memberIsHavingImg: true,
            isLiked: 1,
            ingredient: [{ ingredientName: 'a' }],
            reviewImg: [{ reviewImgPath: 'c', reviewImgIsMain: '', reviewImgNum: '', reviewImgMiddlepath: '', reviewImgExtention: '' }],
            profileImg: [{ profileImgPath: 'a', profileImgMiddlePath: '', profileImgExtention: '' }],
          },
          {
            reviewId: 2,
            totalLikedNum: 10,
            menuName: 'PIKE',
            content: '날아라 용가리',
            storeName: 'Cafe용용',
            score: 3,
            createdDate: new Date('2025-09-15T00:00:00Z'),
            dessertCategoryId: 21,
            memberNickName: 'UserB',
            memberIsHavingImg: true,
            isLiked: 1,
            ingredient: [{ ingredientName: 'b' }],
            reviewImg: [{ reviewImgPath: 'a', reviewImgIsMain: '', reviewImgNum: '', reviewImgMiddlepath: '', reviewImgExtention: '' }],
            profileImg: [{ profileImgPath: 'a', profileImgMiddlePath: '', profileImgExtention: '' }],
          },
        ],
      };

      repository.findLikedReviewList.mockResolvedValue(mockingLikedReview);
      //Act
      const result = await service.getLikedReviewList(dto);
      //Assert
      expect(repository.findLikedReviewList).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('사용자가 좋아요한 리뷰목록만, 좋아요 많은 순서로 조회됨', async () => {
      //Arrange
      const dto = { memberId: 1, sort: 'L' } as ReviewsRequestDto;

      const mockingLikedReview = [
        {
          reviewId: 2,
          totalLikedNum: 10,
          menuName: 'PIKE',
          content: '날아라 용가리',
          storeName: 'Cafe용용',
          score: 3,
          createdDate: new Date('2025-09-15T00:00:00Z'),
          dessertCategoryId: 21,
          memberNickName: 'UserB',
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
        {
          reviewId: 1,
          totalLikedNum: 5,
          menuName: 'Cake',
          content: 'Good',
          storeName: 'Cafe',
          score: 4,
          createdDate: new Date('2025-09-16T00:00:00Z'),
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
      ];
      const expectedResult = {
        hasNextPage: false,
        nextCursor: null,
        items: [
          {
            reviewId: 2,
            totalLikedNum: 10,
            menuName: 'PIKE',
            content: '날아라 용가리',
            storeName: 'Cafe용용',
            score: 3,
            createdDate: new Date('2025-09-15T00:00:00Z'),
            dessertCategoryId: 21,
            memberNickName: 'UserB',
            memberIsHavingImg: true,
            isLiked: 1,
            ingredient: [{ ingredientName: 'b' }],
            reviewImg: [{ reviewImgPath: 'a', reviewImgIsMain: '', reviewImgNum: '', reviewImgMiddlepath: '', reviewImgExtention: '' }],
            profileImg: [{ profileImgPath: 'a', profileImgMiddlePath: '', profileImgExtention: '' }],
          },
          {
            reviewId: 1,
            totalLikedNum: 5,
            menuName: 'Cake',
            content: 'Good',
            storeName: 'Cafe',
            score: 4,
            createdDate: new Date('2025-09-16T00:00:00Z'),
            dessertCategoryId: 10,
            memberNickName: 'UserA',
            memberIsHavingImg: true,
            isLiked: 1,
            ingredient: [{ ingredientName: 'a' }],
            reviewImg: [{ reviewImgPath: 'c', reviewImgIsMain: '', reviewImgNum: '', reviewImgMiddlepath: '', reviewImgExtention: '' }],
            profileImg: [{ profileImgPath: 'a', profileImgMiddlePath: '', profileImgExtention: '' }],
          },
        ],
      };
      repository.findLikedReviewList.mockResolvedValue(mockingLikedReview);
      //Act
      const result = await service.getLikedReviewList(dto);
      //Assert
      expect(repository.findLikedReviewList).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('사용자가 좋아요한 Review가 없으면 빈 배열 반환', async () => {
      //Arrange
      const dto = { memberId: 1, sort: 'L' } as ReviewsRequestDto;
      repository.findLikedReviewList.mockResolvedValue([]);
      //Act
      const result = await service.getLikedReviewList(dto);
      //Assert
      expect(repository.findLikedReviewList).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ hasNextPage: false, items: [], nextCursor: null });
    });

    it('응답데이터 목록에는 리뷰ID가 중복되지 않음(재료,이미지 중복 X)', async () => {
      //Arrange
      const dto = { memberId: 1, sort: 'L' } as ReviewsRequestDto;
      repository.findLikedReviewList.mockResolvedValue([
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

      //Act
      const result = await service.getLikedReviewList(dto);

      //Assert
      expect(repository.findLikedReviewList).toHaveBeenCalledWith(dto);
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
    }); //it
  }); //describe

  /**
   * 리뷰이미지 하나 저장 정책
   * 1. 이미지 저장시, 리뷰아이디 필수 -> 없으면 오류반환
   * 2. 해당 리뷰아이디의 이미지 갯수 확인 -> 4개 넘으면 오류반환
   * 3. 이미지 하나 저장
   */
  describe('postReviewImg', () => {
    const dto = { reviewId: 1, isMain: true, num: 1 } as ReviewImgSaveDto;
    const file = {
      originalname: 'imgName.jpg',
      filename: 'imgName.jpg',
    } as Express.Multer.File;

    const mockDate = new Date('2025-01-01T12:00:00Z');
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(mockDate); //mocke date를 시스템시간으로 설정
    });
    afterEach(() => {
      jest.useRealTimers(); //시스템 시간 복구
    });

    it('이미지 저장시, 리뷰아이디 필수 -> 없으면 오류반환', async () => {
      //Arrange
      repository.findReviewId.mockResolvedValue(undefined);
      //Act and Assert
      await expect(service.postReviewImg(dto, file)).rejects.toThrow(BadRequestException);
      expect(repository.findReviewId).toHaveBeenCalledWith(dto.reviewId);
      expect(repository.countReviewImg).not.toHaveBeenCalled();
      expect(fileService.generateFilename).not.toHaveBeenCalled();
      expect(fileService.upload).not.toHaveBeenCalled();
      expect(repository.insertReviewImg).not.toHaveBeenCalled();
    }); //it

    it('리뷰에 할당된 이미지 갯수 4개 초과시 오류 반환. 최대 4개 가능', async () => {
      //Arrange
      repository.findReviewId.mockResolvedValue({ reviewId: 1 } as Review);
      repository.countReviewImg.mockResolvedValue(4);
      //Act and Assert
      await expect(service.postReviewImg(dto, file)).rejects.toThrow(BadRequestException);
      expect(repository.findReviewId).toHaveBeenCalledWith(dto.reviewId);
      expect(repository.countReviewImg).toHaveBeenCalled();
      expect(fileService.generateFilename).not.toHaveBeenCalled();
      expect(fileService.upload).not.toHaveBeenCalled();
      expect(repository.insertReviewImg).not.toHaveBeenCalled();
    }); //it

    it('리뷰 이미지 하나 저장 성공case', async () => {
      repository.findReviewId.mockResolvedValue({ reviewId: 1 } as Review);
      repository.countReviewImg.mockResolvedValue(3);
      repository.insertReviewImg.mockResolvedValue({
        identifiers: [{ reviewImgId: 2 }],
        generatedMaps: [{ reviewImgId: 2, path: 'imgName', extention: '.jpg' }],
        raw: { reviewImgId: 2 },
      } as InsertResult);
      const today = dayjs().format('YYYYMMDD');
      const middlePath = `reviewImg/${today}`;

      const lastPath = `lastPath_1234567789.png`;
      fileService.generateFilename.mockResolvedValue(lastPath);

      //Act
      const result = await service.postReviewImg(dto, file);

      //Assert
      expect(result).toEqual({ reviewImgId: 2 });
      expect(repository.findReviewId).toHaveBeenCalledWith(dto.reviewId);
      expect(repository.countReviewImg).toHaveBeenCalledWith(dto);
      expect(fileService.generateFilename).toHaveBeenCalledWith(file.originalname);
      expect(fileService.upload).toHaveBeenCalledWith(file, lastPath, middlePath);

      expect(repository.insertReviewImg).toHaveBeenCalled();
    }); //it
  }); //describe

  /**
   * 리뷰이미지 하나 삭제 정책
   * 1. 이미지 삭제시 물리 파일도 같이 삭제
   */
  describe('deleteReviewImg', () => {
    const dto = { reviewImgId: 2 } as ReviewImgIdDto;
    it('이미지 하나 삭제 성공', async () => {
      //Arrange
      const file: ReviewImg = { middlepath: 'reviewImg/20250103', path: 'test_1234556789.png' } as ReviewImg;
      repository.deleteReviewImg.mockResolvedValue();
      repository.findReviewImg.mockResolvedValue(file);
      //Act
      const result = await service.deleteReviewImg(dto);
      //Assert
      expect(repository.deleteReviewImg).toHaveBeenCalledWith(dto);
      expect(repository.findReviewImg).toHaveBeenCalledWith(dto);
      expect(fileService.delete).toHaveBeenCalledWith(file.middlepath, file.path);
    }); //it
  }); //describe

  /**
   * 리뷰이미지 순서 변경 정책
   * 1. 메인과 순서 수정
   * 2. 변경할 리뷰이미지 정보와 기존 리뷰이미지 정보 매핑 -> 수정
   */
  describe('updateReviewImg', () => {
    it('', async () => {}); //it
  }); //describe
});
