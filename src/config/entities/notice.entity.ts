import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Notice {
  @PrimaryGeneratedColumn()
  noticeId: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ default: true })
  isNotice: boolean;

  @Column({ default: false })
  isTopFixed: boolean;

  @Column({ default: true })
  isUsable: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
