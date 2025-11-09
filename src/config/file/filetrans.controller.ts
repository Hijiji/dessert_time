import { Controller, Post, Get, Delete, Param, Res, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileTransService } from './filetrans.service';
import { multerOptionsFactory } from './multer.option.factory';
import * as multer from 'multer';

@Controller()
@ApiTags('File')
export class FileTransController {
  constructor(private fileService: FileTransService) {}

  @Post('upload')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: '파일 업로드', description: '파일을 클라우드 스토리지에 업로드합니다.' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async cloudUploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.fileService.upload(file, file.originalname, 'test');
    return { url };
  }

  @Get(':filename')
  @ApiOperation({ summary: '파일 다운로드', description: '클라우드 스토리지에서 파일을 다운로드합니다.' })
  @ApiParam({ name: 'filename', description: '다운로드할 파일명' })
  async cloudDownloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const file = await this.fileService.download(filename);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(file);
  }

  @Delete(':filename')
  @ApiOperation({ summary: '파일 삭제', description: '클라우드 스토리지에서 파일을 삭제합니다.' })
  @ApiParam({ name: 'filename', description: '삭제할 파일명' })
  @ApiResponse({ status: 200, description: '삭제 완료', schema: { example: { message: '삭제 완료' } } })
  async delete(@Param('filename') filename: string) {
    await this.fileService.delete('test', filename);
    return { message: '삭제 완료' };
  }

  //-디스크 저장방식 -//

  @ApiOperation({ summary: '파일 리스트 저장' })
  @Post('files/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 30, multerOptionsFactory('reviewImg')))
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.fileService.uploadFiles(files);
  }

  @ApiOperation({ summary: '파일 하나 저장' })
  @Post('file/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptionsFactory('reviewImg')))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.uploadFile(file);
  }

  /**
   * 파일 삭제 : 매일 5시간 간격으로 덤프폴더 내부 파일 삭제
   * @returns
   */
  @Cron(CronExpression.EVERY_5_HOURS)
  async deleteFile() {
    // const filepath = process.env.dumpfile;
    // return this.fileService.deleteFiles(filepath);
  }
}
