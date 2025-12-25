import { Exclude } from 'class-transformer';
import { IsDefined, IsNotEmpty, Length } from 'class-validator';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @Column('text')
  @IsDefined()
  @IsNotEmpty()
  @Length(2, 100)
  title: string;

  @Column('text')
  @IsDefined()
  @IsNotEmpty()
  @Length(2, 500)
  description: string;

  @ManyToOne(() => Category, (category) => category.children)
  category: Category;

  @Column('text', { array: true, default: [] })
  images: string[];

  @ManyToOne(() => User, (user) => user.skills)
  owner: User;

  @ManyToMany(() => User, (user) => user.favoriteSkills)
  @JoinTable()
  interestedUsers: User[];
}
