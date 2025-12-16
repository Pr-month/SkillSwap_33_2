import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  refreshToken: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE', // при удалении родителя удаляются связанные записи
    onUpdate: 'CASCADE', // при обновлении — обновляются связанные записи
  })
  @Exclude()
  user: User;
}
