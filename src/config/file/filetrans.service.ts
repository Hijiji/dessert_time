import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ObjectStorageClient } from 'oci-objectstorage';
import { ConfigFileAuthenticationDetailsProvider } from 'oci-common';
import * as oci from 'oci-sdk';

import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileTransService {
  private readonly objectStorage: ObjectStorageClient;
  private readonly namespaceName: string;
  private readonly bucketName = 'dessert-time-bucket'; // 생성한 버킷 이름

  constructor() {
    const provider = new ConfigFileAuthenticationDetailsProvider(); // ~/.oci/config 사용
    this.objectStorage = new ObjectStorageClient({ authenticationDetailsProvider: provider });
    this.namespaceName = process.env.OCI_NAMESPACE || 'axnq53u2nw4n';
  }

  /**
   * 파일명 변경
   * @param originalName
   * @returns
   */
  async generateFilename(originalName: string) {
    const ext = path.extname(originalName); // 확장자 추출 (.png)
    const basename = path.basename(originalName, ext); // 파일명 (example)
    return `${basename}_${uuid().substring(0, 10)}${ext}`; // example_f81d4fae7d.png
  }

  /**
   * storage에 파일 업로드
   * @param file
   * @param fileName
   * @param middlePath
   * @returns
   */
  async upload(file: Express.Multer.File, fileName, middlePath): Promise<string> {
    if (!file) throw new BadRequestException('파일이 존재하지 않습니다.');

    const request = {
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: `${middlePath}/${fileName}`, //file.originalname,
      putObjectBody: file.buffer,
      contentLength: file.size,
    };

    await this.objectStorage.putObject(request);

    // Object URL 형식 반환 (공개 버킷일 경우 바로 접근 가능)
    return `https://objectstorage.ap-seoul-1.oraclecloud.com/n/${this.namespaceName}/b/${this.bucketName}/o/${middlePath}/${fileName}`;
  }

  /**
   * storage에 파일 다운로드
   * @param filename
   * @returns
   */
  async download(path: string, middlePath: string): Promise<Buffer> {
    try {
      const response = await this.objectStorage.getObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName: `${middlePath}/${path}`,
      });

      const value = response.value;

      // Node.js Readable Stream인 경우
      if (value instanceof Readable) {
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
          value.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          value.on('end', () => resolve(Buffer.concat(chunks)));
          value.on('error', (err) => reject(err));
        });
      }

      //  Web ReadableStream인 경우 (Node 18+ 환경에서 사용)
      if (value && typeof value.getReader === 'function') {
        const reader = value.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          chunks.push(chunk);
        }

        return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
      }
    } catch (error) {
      throw new InternalServerErrorException(`파일 다운로드 실패: ${error.message}`);
    }
  }
  /**
   * storage에 파일 삭제
   * @param middlePath
   * @param filename
   */
  async delete(middlePath: string, filename: string): Promise<void> {
    await this.objectStorage.deleteObject({
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: `${middlePath}/${filename}`,
    });
  }

  //-기존 데이터-//
  async uploadFiles(files: Array<Express.Multer.File>) {
    if (!files) {
      throw Error('파일이 존재하지 않습니다.');
    }
    return files;
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw Error('파일이 존재하지 않습니다.');
    }
    return file;
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    //__dirname : 현재 디랙토리까지 경로,  process.cwd() : 프로젝트 경로,  __filename : 현재 파일까지의 경로
    let fileDirectoryPath = path.join(process.env.fileroot, filePath); //파일 풀경로
    const readStream = fs.createReadStream(fileDirectoryPath, {
      highWaterMark: 1000000000,
    });
    return new Promise(async (resolve, reject) => {
      readStream.on(
        'data',
        await function (fileData: Buffer) {
          resolve(fileData);
        }.bind(this),
      );
    });
  }

  //파일삭제
  async deleteFile(filePath) {
    let fileDirectoryPath = path.join(process.env.fileroot, filePath); //파일 풀경로
    fs.unlink(fileDirectoryPath, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  //폴더 안에 있는 파일목록 삭제
  async deleteFiles(filePath) {
    try {
      //fs.readdirSync : 해당경로의 파일들을 가져온다.
      const files = fs.readdirSync(path.join(process.env.fileroot, filePath));
      if (files.length) files.forEach((f) => this.deleteFile(path.join(filePath, f)));
    } catch (err) {
      console.error(err);
      return;
    }
  }
}
