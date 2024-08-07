import { Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewCategoryDto } from './dto/review.category.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LikeDto } from './dto/like.dto';
import { TransactionInterceptor } from 'src/config/interceptor/transaction.interceptor';

@Controller('review')
@ApiTags('Review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: '선택한 카테고리의 리뷰 목록 조회' })
  @Get('category/list/:dessertCategoryId/:selectedOrder/:memberId')
  async getReviewCategoryList(@Param() reviewCategoryDto: ReviewCategoryDto) {
    return await this.reviewService.findReviewCategoryList(reviewCategoryDto);
  }
  @ApiOperation({ summary: '리뷰 좋아요' })
  @UseInterceptors(TransactionInterceptor)
  @Post('like/:memberId/:reviewId/:isLike')
  async postLikeItem(@Param() likeDto: LikeDto) {
    await this.reviewService.postLikeItem(likeDto);
  }
}
