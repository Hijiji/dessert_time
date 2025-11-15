import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ReviewIdDto {
  @ApiProperty({
    example: '1',
    description: '리뷰 Id',
    required: true,
  })
  @IsNotEmpty()
  readonly reviewId: number;

  @ApiProperty({
    example: '1',
    description: '사용자 Id',
    required: true,
  })
  @IsNotEmpty()
  readonly memberId: number;
}
