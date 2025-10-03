import { Injectable, ValidationPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v1 as uuid } from 'uuid';
import { Ingredient } from '../entities/ingredient.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InitRepository {
  constructor(@InjectRepository(Ingredient) private ingredient: Repository<Ingredient>) {}

  async insertIngredient() {
    const ingreList = ['과일', '견과류', '채소/향신료', '초콜릿/캐러맬', '커피/차/시럽류', '크림/치즈/유제품', '기타'];
    const ingreCount = await this.ingredient.count();
    if (ingreCount < ingreList.length) {
      const entities = ingreList.map((name) => this.ingredient.create({ ingredientName: name, usable: true }));
      await this.ingredient.save(entities); // insert() 대신 save() 사용
    }
  }
}
