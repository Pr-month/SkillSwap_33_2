import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { SkillType } from '../enums';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SkillType,
    default: SkillType.TEACH,
  })
  type: SkillType;

  @Column('simple-array', { nullable: true })
  images: string[];

  @ManyToOne(
    () => User,
    /* (user) => user.skills, <- ⚠️раскомментируй это, если Entity готов **/ {
      nullable: false,
      onDelete: 'CASCADE', // При удалении пользователя удаляются его навыки
    },
  )
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @ManyToOne(
    () => Category,
    /* (category) => category.skills, <- ⚠️раскомментируй это, если Entity готов **/ {
      nullable: false,
      onDelete: 'RESTRICT', // Нельзя удалить категорию, если есть навыки
    },
  )
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
