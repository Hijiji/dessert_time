import { PageRequest } from '../../common/dto/page.request';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NoticeSearchEnum } from '../../common/enum/notice.enum';

export class SearchNoticeDto extends PageRequest {
  @IsEnum(NoticeSearchEnum)
  @IsOptional()
  @ApiProperty({
    type: NoticeSearchEnum,
    description: '검색어 종류',
    required: false,
  })
  searchType?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    description: '검색값',
    required: false,
  })
  searchValue?: string;
}
