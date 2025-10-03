import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BlockedMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  primaryMemberId: number;

  @Column()
  blockedMemberId: number;
}
