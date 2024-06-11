import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Accusation } from './config/entities/accusation.entity';
import { UserInterestDessert } from './config/entities/user.interest.dessert.entity';
import { Img } from './config/entities/img.entity';
import { Like } from './config/entities/like.entity';
import { Point } from './config/entities/point.entity';
import { QnA } from './config/entities/qna.entity';
import { Review } from './config/entities/review.entity';
import { ReviewImg } from './config/entities/review.img.entity';
import { Member } from './config/entities/member.entity';
import { DessertCategory } from './config/entities/dessert.category.entity';
import { Notice } from './config/entities/notice.entity';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'oracle',
    connectString: `(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.ap-chuncheon-1.oraclecloud.com))(connect_data=(service_name=ga0c4cbf63f5084_dbdesserttime_medium.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))`,
    username: 'admin',
    password: 'DTelwjxmxkdla8*',
    entities: [Accusation,UserInterestDessert,Img,Like,Point,QnA,Review,ReviewImg,Member,DessertCategory,Notice],
    synchronize: true,
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
