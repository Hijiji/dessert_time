import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class NoticeDto {
  @Transform((value) => {
    return value.value == 'true' ? true : false;
  })
  @ApiProperty({
    example: '공지조회 :true/ 이벤트조회:false',
    description: '공지, 이벤트 목록조회',
    required: true,
  })
  @IsNotEmpty()
  readonly isNotice: boolean;

  @ApiProperty({
    example: '1',
    description: '공지/이벤트 하나조회',
    required: true,
  })
  @IsNotEmpty()
  readonly noticeId: number;
}