import { Injectable, BadRequestException } from '@nestjs/common';
import { ObjectStorageClient } from 'oci-objectstorage';
import { ConfigFileAuthenticationDetailsProvider } from 'oci-common';
import * as oci from 'oci-sdk';

import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FileTransService {
  private readonly objectStorage: ObjectStorageClient;
  private readonly namespaceName: string;
  private readonly bucketName = 'my-bucket'; // 생성한 버킷 이름으로 변경

  constructor() {
    const provider = new ConfigFileAuthenticationDetailsProvider(); // ~/.oci/config 사용
    this.objectStorage = new ObjectStorageClient({ authenticationDetailsProvider: provider });
    this.namespaceName = process.env.OCI_NAMESPACE || ''; // 아래에 나올 Namespace 등록 필요
  }

  // 🟢 파일 업로드
  async upload(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('파일이 존재하지 않습니다.');

    const request = {
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: file.originalname,
      putObjectBody: file.buffer,
      contentLength: file.size,
    };

    await this.objectStorage.putObject(request);

    // Object URL 형식 반환 (공개 버킷일 경우 바로 접근 가능)
    return `https://objectstorage.ap-seoul-1.oraclecloud.com/n/${this.namespaceName}/b/${this.bucketName}/o/${encodeURIComponent(file.originalname)}`;
  }

  // 🟣 파일 다운로드
  async download(filename: string): Promise<Buffer> {
    const response = await this.objectStorage.getObject({
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: filename,
    });

    return Buffer.from(await response.value.arrayBuffer());
  }

  // 🔵 파일 삭제
  async delete(filename: string): Promise<void> {
    await this.objectStorage.deleteObject({
      namespaceName: this.namespaceName,
      bucketName: this.bucketName,
      objectName: filename,
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
