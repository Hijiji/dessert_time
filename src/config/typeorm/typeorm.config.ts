import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { UserInterestDessert } from '../entities/user.interest.dessert.entity';
import { Member } from '../entities/member.entity';
import { ProfileImg } from '../entities/profile.img.entity';
import { Review } from '../entities/review.entity';
import { ReviewImg } from '../entities/review.img.entity';
import { QnA } from '../entities/qna.entity';
import { Notice } from '../entities/notice.entity';
import { Accusation } from '../entities/accusation.entity';
import { DessertCategory } from '../entities/dessert.category.entity';
import { Like } from '../entities/like.entity';
import { Point } from '../entities/point.entity';
import { PointHistory } from '../entities/point.history.entity';
import { ReceiptImg } from '../entities/receipt.Img.entity';
import { ReviewIngredient } from '../entities/review.ingredient.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { MemberDeletion } from '../entities/member.deleteion.entity';
dotenv.config();

export const typeORMConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
  return {
    //keepConnectionAlive: false,
    type: 'oracle',
    username: 'admin',
    password: 'DTelwjxmxkdla8*',
    //    connectString: 'dbdesserttime_high', // tnsnames.ora에 있는 alias 사용
    connectString: `(description= (retry_count=20)(retry_delay=3) (address=(protocol=tcps)(port=1522)(host=adb.ap-chuncheon-1.oraclecloud.com)) (connect_data=(service_name=ga0c4cbf63f5084_dbdesserttime_tp.adb.oraclecloud.com)) (security=(ssl_server_dn_match=yes)))`,
    // extra: {
    //   // oracledb에 직접 전달되는 옵션
    //   configDir: '/Users/jeongjimin/Downloads/Wallet_dbdesserttime',
    //   walletLocation: '/Users/jeongjimin/Downloads/Wallet_dbdesserttime',
    //   walletPassword: 'DTelwjxmxkdla8*', // Autonomous DB는 보통 null
    // },

    entities: [MemberDeletion, UserInterestDessert, Member, ProfileImg, Like, Review, ReviewImg, QnA, Notice, Accusation, DessertCategory, Point, PointHistory, ReceiptImg, Ingredient, ReviewIngredient],

    synchronize: false,
    logging: true,

    // extra: {
    //   // oracledb에 직접 전달되는 옵션
    //   configDir: '/Users/jeongjimin/Downloads/Wallet_dbdesserttime',
    //   walletLocation: '/Users/jeongjimin/Downloads/Wallet_dbdesserttime',
    //   walletPassword: 'DTelwjxmxkdla8*', // Autonomous DB는 보통 null
    // },
    // connectString: `(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-chuncheon-1.oraclecloud.com))(connect_data=(service_name=ga0c4cbf63f5084_dbdesserttime_medium.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))`,
    // connectString: `(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-chuncheon-1.oraclecloud.com))(connect_data=(service_name=ga0c4cbf63f5084_dbdesserttime_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))`,
    //connectTimeout: 30, //30초가 지나면 트랜잭션을 롤백한다.
    // migrations: [process.cwd() + '\\src\\database\\migrations\\*.ts'],
    // migrationsRun: true, //자동적으로 처음 migration이 실행되도록 한다.
  };
};
