import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * Creates a mock repository with common TypeORM methods
 */
export const createMockRepository = <T extends ObjectLiteral = any>(): jest.Mocked<Repository<T>> => {
    const mockRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findOneOrFail: jest.fn(),
        findAndCount: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        softDelete: jest.fn(),
        restore: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
        merge: jest.fn(),
        preload: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        query: jest.fn(),
        clear: jest.fn(),
        increment: jest.fn(),
        decrement: jest.fn(),
        findByIds: jest.fn(),
        findOneBy: jest.fn(),
        findBy: jest.fn(),
        exist: jest.fn(),
        exists: jest.fn(),
        existsBy: jest.fn(),
        countBy: jest.fn(),
        sum: jest.fn(),
        average: jest.fn(),
        minimum: jest.fn(),
        maximum: jest.fn(),
        findAndCountBy: jest.fn(),
        findOneByOrFail: jest.fn(),
        upsert: jest.fn(),
        recover: jest.fn(),
        // Add metadata property
        metadata: {
            tableName: 'test_table',
            targetName: 'TestEntity',
        } as any,
        // Add manager property
        manager: {} as any,
        // Add target property
        target: {} as any,
        // Add queryRunner property
        queryRunner: null as any,
    };

    return mockRepo as unknown as jest.Mocked<Repository<T>>;
};

/**
 * Creates a mock query builder with common methods
 */
export const createMockQueryBuilder = <T extends ObjectLiteral = any>(): jest.Mocked<SelectQueryBuilder<T>> => {
    const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        andHaving: jest.fn().mockReturnThis(),
        orHaving: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        cache: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
        getCount: jest.fn(),
        getManyAndCount: jest.fn(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        stream: jest.fn(),
        execute: jest.fn(),
        getQuery: jest.fn(),
        getSql: jest.fn(),
        setParameter: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        useTransaction: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        loadRelationIdAndMap: jest.fn().mockReturnThis(),
        relation: jest.fn().mockReturnThis(),
        of: jest.fn().mockReturnThis(),
        loadMany: jest.fn(),
        loadOne: jest.fn(),
        clone: jest.fn().mockReturnThis(),
        subQuery: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        addFrom: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        onConflict: jest.fn().mockReturnThis(),
        distinctOn: jest.fn().mockReturnThis(),
    };

    return queryBuilder as unknown as jest.Mocked<SelectQueryBuilder<T>>;
};

/**
 * Helper to create a mock repository with preset return values
 */
export class MockRepositoryHelper<T extends ObjectLiteral> {
    private mockRepo: jest.Mocked<Repository<T>>;

    constructor() {
        this.mockRepo = createMockRepository<T>();
    }

    setFindOneResponse(response: T | undefined): MockRepositoryHelper<T> {
        this.mockRepo.findOne.mockResolvedValue(response || null);
        return this;
    }

    setFindResponse(response: T[]): MockRepositoryHelper<T> {
        this.mockRepo.find.mockResolvedValue(response);
        return this;
    }

    setFindAndCountResponse(response: [T[], number]): MockRepositoryHelper<T> {
        this.mockRepo.findAndCount.mockResolvedValue(response);
        return this;
    }

    setSaveResponse(response: T): MockRepositoryHelper<T> {
        this.mockRepo.save.mockResolvedValue(response);
        return this;
    }

    setCreateResponse(response: T): MockRepositoryHelper<T> {
        this.mockRepo.create.mockReturnValue(response);
        return this;
    }

    setCountResponse(count: number): MockRepositoryHelper<T> {
        this.mockRepo.count.mockResolvedValue(count);
        return this;
    }

    getRepository(): jest.Mocked<Repository<T>> {
        return this.mockRepo;
    }
}