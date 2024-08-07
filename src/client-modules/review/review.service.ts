import { Injectable } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { ReviewCategoryDto } from './dto/review.category.dto';
import { LikeDto } from './dto/like.dto';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) {}

  /**
   * 선택한 카테고리의 리뷰 목록 조회
   * @param reviewCategoryDto
   * @returns
   */
  async findReviewCategoryList(reviewCategoryDto: ReviewCategoryDto) {
    try {
      if (reviewCategoryDto.selectedOrder === 'D')
        return await this.reviewRepository.findReviewCategoryDateList(
          reviewCategoryDto,
        );
      else if (reviewCategoryDto.selectedOrder === 'L')
        return await this.reviewRepository.findReviewCategoryLikeList(
          reviewCategoryDto,
        );
    } catch (error) {
      throw error;
    }
  }
  /**
   * 리뷰 좋아요/ 좋아요취소
   * @param likeDto
   */
  async postLikeItem(likeDto: LikeDto) {
    try {
      if (likeDto.isLike === false) {
        const isLikedData = await this.reviewRepository.findLikeId(likeDto);
        if (isLikedData) {
          return await this.reviewRepository.deleteReviewLike(
            isLikedData.likeId,
          );
        }
      } else if (likeDto.isLike === true) {
        const isMemberData = await this.reviewRepository.findMemberId(likeDto);
        const isReviewData = await this.reviewRepository.findReviewId(likeDto);

        if (isMemberData && isReviewData) {
          return await this.reviewRepository.insertReviewLike(likeDto);
        }
      }
    } catch (error) {
      throw error;
    }
  }
}
