import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitService } from './Init.service';
import { InitRepository } from './init.repository';
import { Ingredient } from '../entities/ingredient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient])],
  controllers: [],
  providers: [InitService, InitRepository],
  exports: [],
})
export class InitModule {}
