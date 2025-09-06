import { Repository, SelectQueryBuilder, FindOptionsWhere, DeepPartial } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResult } from '../interfaces/pagination.interface';
import { AuditableEntity } from '../entities/auditable.entity';
import { User } from '../../users/entities/user.entity';

export abstract class BaseRepository<T extends AuditableEntity> {
    protected repository: Repository<T>;

    constructor(repository: Repository<T>) {
        this.repository = repository;
    }

    // =============================
    // BASE CRUD METHODS
    // =============================
    async create(entity: DeepPartial<T>, currentUser?: User): Promise<T> {
        const newEntity = this.repository.create(entity);

        if (currentUser) {
            (newEntity as any).createdById = currentUser.id;
            (newEntity as any).updatedById = currentUser.id;
        }

        return await this.repository.save(newEntity);
    }

    async findById(id: string, relations: string[] = []): Promise<T> {
        const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<T>,
            relations,
        });

        if (!entity) {
            throw new NotFoundException(`Entity with ID ${id} not found`);
        }

        return entity;
    }

    async findByIdOrFail(id: string, relations: string[] = []): Promise<T> {
        return this.findById(id, relations);
    }

    async update(id: string, updateData: Partial<T>, currentUser?: User): Promise<T> {
        const entity = await this.findById(id);

        if (currentUser) {
            (updateData as any).updatedById = currentUser.id;
        }

        Object.assign(entity, updateData);
        return await this.repository.save(entity);
    }

    async delete(id: string): Promise<void> {
        const result = await this.repository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Entity with ID ${id} not found`);
        }
    }

    async softDelete(id: string, currentUser?: User): Promise<T> {
        const entity = await this.findById(id);

        // If the entity has an isActive field, perform soft delete
        if ('isActive' in entity) {
            (entity as any).isActive = false;
            if (currentUser) {
                (entity as any).updatedById = currentUser.id;
            }
            return await this.repository.save(entity);
        }

        // Otherwise, complete deletion
        await this.repository.delete(id);
        return entity;
    }

    // =============================
    // SEARCH METHODS
    // =============================
    async findAll(relations: string[] = []): Promise<T[]> {
        return await this.repository.find({ relations });
    }

    async findByOrganization(organizationId: string, relations: string[] = []): Promise<T[]> {
        return await this.repository.find({
            where: { organizationId } as unknown as FindOptionsWhere<T>,
            relations,
        });
    }

    async paginate(
        paginationDto: PaginationDto,
        queryBuilder?: SelectQueryBuilder<T>,
    ): Promise<PaginatedResult<T>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = paginationDto.skip;

        const qb = queryBuilder || this.repository.createQueryBuilder('entity');

        // Count total - clone the query to avoid state issues
        const countQb = qb.clone();
        const total = await countQb.getCount();

        // Get paginated data
        const data = await qb.skip(skip).take(limit).getMany();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    // =============================
    // UTILITY METHODS
    // =============================
    async exists(conditions: FindOptionsWhere<T>): Promise<boolean> {
        const count = await this.repository.count({ where: conditions });
        return count > 0;
    }

    async count(conditions?: FindOptionsWhere<T>): Promise<number> {
        return await this.repository.count({ where: conditions });
    }

    protected createQueryBuilder(alias: string = 'entity'): SelectQueryBuilder<T> {
        return this.repository.createQueryBuilder(alias);
    }

    protected addSearchToQuery(
        qb: SelectQueryBuilder<T>,
        searchTerm: string,
        searchFields: string[],
    ): SelectQueryBuilder<T> {
        if (!searchTerm || searchFields.length === 0) return qb;

        const searchConditions = searchFields
            .map((field) => `${field} ILIKE :searchTerm`)
            .join(' OR ');

        return qb.andWhere(`(${searchConditions})`).setParameter('searchTerm', `%${searchTerm}%`);
    }

    protected addDateRangeToQuery(
        qb: SelectQueryBuilder<T>,
        startDate?: string,
        endDate?: string,
        dateField: string = 'createdAt',
    ): SelectQueryBuilder<T> {
        // Convert UTC timestamps to local timezone (EDT/EST) before comparing dates
        // This ensures filtering matches what users see in their local time
        const timezone = process.env.TZ || 'America/New_York';
        
        if (startDate) {
            qb.andWhere(
                `DATE(${dateField} AT TIME ZONE 'UTC' AT TIME ZONE :timezone) >= DATE(:startDate)`,
                { startDate, timezone }
            );
        }
        if (endDate) {
            qb.andWhere(
                `DATE(${dateField} AT TIME ZONE 'UTC' AT TIME ZONE :timezone) <= DATE(:endDate)`,
                { endDate, timezone }
            );
        }
        return qb;
    }
}
