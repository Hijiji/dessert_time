import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserInterestDessert } from './user.interest.dessert.entity';
import { Review } from './review.entity';

@Entity()
export class DessertCategory {
  @PrimaryGeneratedColumn()
  dessertCategoryId: number;

  @Column()
  dessertName: string;

  @Column({ default: 0 })
  parentDCId: number;

  @Column()
  sessionNum: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  @OneToMany(() => UserInterestDessert, (uid) => uid.dc)
  uid: UserInterestDessert[];

  @OneToMany(() => Review, (review) => review.dessertCategory)
  reviews: Review[];
}
