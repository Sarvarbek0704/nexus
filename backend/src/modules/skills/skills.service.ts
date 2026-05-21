import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Skill } from '../../database/entities/skill.entity';
import { Category } from '../../database/entities/category.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { generateSlug } from '../../common/utils/generate.util';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  async createSkill(dto: { name: string; description?: string; categoryId?: string }) {
    const existing = await this.skillRepo.findOne({ where: { name: ILike(dto.name) } });
    if (existing) throw new ConflictException('Skill already exists');
    const skill = this.skillRepo.create(dto);
    return this.skillRepo.save(skill);
  }

  async getSkills(query: any) {
    const { skip, take, page, limit } = getPagination(query);
    const where: any = { isActive: true };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) where.name = ILike(`%${query.search}%`);

    const [data, total] = await this.skillRepo.findAndCount({
      where,
      relations: ['category'],
      order: { usageCount: 'DESC' },
      skip,
      take,
    });
    return paginatedResponse(data, total, page, limit);
  }

  async getTopSkills(limit = 20) {
    return this.skillRepo.find({
      where: { isActive: true },
      relations: ['category'],
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  async getCategories() {
    return this.categoryRepo.find({
      where: { isActive: true, parentId: null },
      relations: ['children', 'skills'],
      order: { sortOrder: 'ASC' },
    });
  }

  async createCategory(dto: { name: string; description?: string; icon?: string; parentId?: string }) {
    const slug = generateSlug(dto.name);
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');
    const category = this.categoryRepo.create({ ...dto, slug });
    return this.categoryRepo.save(category);
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['skills', 'children'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async searchSkills(query: string) {
    return this.skillRepo.find({
      where: { name: ILike(`%${query}%`), isActive: true },
      take: 20,
      order: { usageCount: 'DESC' },
    });
  }
}
