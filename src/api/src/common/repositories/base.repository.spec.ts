import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { AuditableEntity } from '../entities/auditable.entity';
import { createMockRepository } from '../../../test/helpers/mock-repository.helper';
import { createMockUser } from '../../../test/helpers/test-data.helper';

// Create a concrete implementation for testing
class TestEntity extends AuditableEntity {
    id: string;
    name: string;
    organizationId: string;
    isActive: boolean;
}

class TestRepository extends BaseRepository<TestEntity> {
    constructor(repository: Repository<TestEntity>) {
        super(repository);
    }
}

describe('BaseRepository', () => {
    let baseRepository: TestRepository;
    let mockRepository: jest.Mocked<Repository<TestEntity>>;

    beforeEach(() => {
        mockRepository = createMockRepository<TestEntity>();
        baseRepository = new TestRepository(mockRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create entity successfully', async () => {
            const entityData = {
                name: 'Test Entity',
                organizationId: 'org-123',
            };
            const createdEntity = {
                id: 'entity-123',
                ...entityData,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as unknown as TestEntity;

            mockRepository.create.mockReturnValue(createdEntity);
            mockRepository.save.mockResolvedValue(createdEntity);

            const result = await baseRepository.create(entityData);

            expect(mockRepository.create).toHaveBeenCalledWith(entityData);
            expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
            expect(result).toEqual(createdEntity);
        });

        it('should set audit fields when currentUser is provided', async () => {
            const entityData = {
                name: 'Test Entity',
                organizationId: 'org-123',
            };
            const currentUser = createMockUser();
            const createdEntity = {
                id: 'entity-123',
                ...entityData,
            } as unknown as TestEntity;

            mockRepository.create.mockReturnValue(createdEntity);
            mockRepository.save.mockResolvedValue(createdEntity);

            await baseRepository.create(entityData, currentUser);

            expect(mockRepository.create).toHaveBeenCalledWith(entityData);
            expect(mockRepository.save).toHaveBeenCalled();
            const saveCall = mockRepository.save.mock.calls[0][0];
            expect((saveCall as any).createdById).toBe(currentUser.id);
            expect((saveCall as any).updatedById).toBe(currentUser.id);
        });
    });

    describe('findById', () => {
        it('should return entity when found', async () => {
            const entity = {
                id: 'entity-123',
                name: 'Test Entity',
            } as unknown as TestEntity;

            mockRepository.findOne.mockResolvedValue(entity);

            const result = await baseRepository.findById('entity-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'entity-123' },
                relations: [],
            });
            expect(result).toEqual(entity);
        });

        it('should throw NotFoundException when entity not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(baseRepository.findById('non-existent')).rejects.toThrow(NotFoundException);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'non-existent' },
                relations: [],
            });
        });

        it('should include relations when specified', async () => {
            const entity = {
                id: 'entity-123',
                name: 'Test Entity',
            } as unknown as TestEntity;

            mockRepository.findOne.mockResolvedValue(entity);

            await baseRepository.findById('entity-123', ['relation1', 'relation2']);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'entity-123' },
                relations: ['relation1', 'relation2'],
            });
        });
    });

    describe('update', () => {
        it('should update entity successfully', async () => {
            const existingEntity = {
                id: 'entity-123',
                name: 'Old Name',
            } as unknown as TestEntity;
            const updateData = { name: 'New Name' };
            const updatedEntity = {
                ...existingEntity,
                ...updateData,
            } as unknown as TestEntity;

            mockRepository.findOne.mockResolvedValue(existingEntity);
            mockRepository.save.mockResolvedValue(updatedEntity);

            const result = await baseRepository.update('entity-123', updateData);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'entity-123' },
                relations: [],
            });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(updatedEntity);
        });

        it('should set updatedById when currentUser is provided', async () => {
            const existingEntity = {
                id: 'entity-123',
                name: 'Old Name',
            } as unknown as TestEntity;
            const updateData = { name: 'New Name' };
            const currentUser = createMockUser();

            mockRepository.findOne.mockResolvedValue(existingEntity);
            mockRepository.save.mockResolvedValue(existingEntity);

            await baseRepository.update('entity-123', updateData, currentUser);

            expect(mockRepository.save).toHaveBeenCalled();
            const saveCall = mockRepository.save.mock.calls[0][0];
            expect((saveCall as any).updatedById).toBe(currentUser.id);
        });

        it('should throw NotFoundException when entity not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                baseRepository.update('non-existent', { name: 'New Name' })
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('softDelete', () => {
        it('should soft delete entity successfully', async () => {
            const existingEntity = {
                id: 'entity-123',
                name: 'Test Entity',
                organizationId: 'org-123',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdById: 'user-123',
                updatedById: 'user-123',
                deletedById: null,
            } as unknown as TestEntity;

            mockRepository.findOne.mockResolvedValue(existingEntity);
            mockRepository.save.mockResolvedValue({ ...existingEntity, isActive: false } as unknown as TestEntity);

            await baseRepository.softDelete('entity-123');

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            const saveCall = mockRepository.save.mock.calls[0][0];
            expect((saveCall as any).isActive).toBe(false);
        });

        it('should set updatedById when currentUser is provided', async () => {
            const existingEntity = {
                id: 'entity-123',
                name: 'Test Entity',
                organizationId: 'org-123',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdById: 'user-123',
                updatedById: 'user-123',
            } as unknown as TestEntity;
            const currentUser = createMockUser();

            mockRepository.findOne.mockResolvedValue(existingEntity);
            mockRepository.save.mockResolvedValue(existingEntity);

            await baseRepository.softDelete('entity-123', currentUser);

            const saveCall = mockRepository.save.mock.calls[0][0];
            expect((saveCall as any).updatedById).toBe(currentUser.id);
            expect((saveCall as any).isActive).toBe(false);
        });
    });

    describe('findAll', () => {
        it('should return all entities', async () => {
            const entities = [
                { id: 'entity-1', name: 'Entity 1' },
                { id: 'entity-2', name: 'Entity 2' },
            ] as TestEntity[];

            mockRepository.find.mockResolvedValue(entities);

            const result = await baseRepository.findAll();

            expect(result).toEqual(entities);
            expect(mockRepository.find).toHaveBeenCalledWith({ relations: [] });
        });
    });

    describe('paginate', () => {
        it('should return paginated entities', async () => {
            const entities = [
                { id: 'entity-1', name: 'Entity 1' },
                { id: 'entity-2', name: 'Entity 2' },
            ] as TestEntity[];
            const paginationDto = { page: 1, limit: 10, skip: 0 };
            const total = 2;

            const mockQueryBuilder = {
                clone: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(total),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(entities),
            };

            mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

            const result = await baseRepository.paginate(paginationDto);

            expect(result.data).toEqual(entities);
            expect(result.meta.total).toBe(total);
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entity');
        });
    });
});