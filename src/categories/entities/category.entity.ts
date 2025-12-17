import { IsDefined, IsNotEmpty, Length } from "class-validator";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsDefined()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ManyToOne(() => Category, category => category.children, { nullable: true })
  parent: Category | null;

  @OneToMany(() => Category, category => category.children)
  children: Category[];
}