import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BlockedMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  primaryMemberId: string;

  @Column()
  blockedMemberId: string;
}
