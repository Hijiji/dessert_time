import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class ReviewImgSaveDto {
  @ApiProperty({
    example: '1',
    description: '리뷰 Id',
    required: true,
  })
  @IsNotEmpty()
  readonly reviewId: number;

  @ApiProperty({
    example: 'true',
    description: '메인사진이면 true',
    required: true,
  })
  @Transform(({ value }) => (value === 'true' ? true : false)) // 문자열 "true"를 boolean true로 변환
  @IsNotEmpty()
  readonly isMain: boolean;

  @ApiProperty({
    example: '1',
    description: '사진순서(메인은 1)',
    required: true,
  })
  @IsNotEmpty()
  readonly num: number;
}
