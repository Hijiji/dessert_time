import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { ReviewIngredient } from './review.ingredient.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn('increment', { type: 'number', name: 'ingredientId' })
  ingredientId: number;

  @Column({ unique: true })
  ingredientName: string;

  @Column({ default: true })
  usable: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @OneToMany(() => ReviewIngredient, (reviewIngredients) => reviewIngredients.ingredient)
  reviewIngredients: ReviewIngredient[];
}
