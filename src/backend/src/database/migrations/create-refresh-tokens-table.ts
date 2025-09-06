import { MigrationInterface, QueryRunner, Table, Index, TableIndex } from 'typeorm';

export class CreateRefreshTokensTable1640000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'refresh_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '500',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                    },
                    {
                        name: 'is_revoked',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'ip_address',
                        type: 'varchar',
                        length: '45',
                        isNullable: true,
                    },
                    {
                        name: 'user_agent',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
        );

        // Create indexes for performance
        await queryRunner.createIndex(
            'refresh_tokens',
            new TableIndex({
                name: 'IDX_refresh_tokens_token',
                columnNames: ['token'],
            }),
        );

        await queryRunner.createIndex(
            'refresh_tokens',
            new TableIndex({
                name: 'IDX_refresh_tokens_user_id',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'refresh_tokens',
            new TableIndex({
                name: 'IDX_refresh_tokens_expires_at',
                columnNames: ['expires_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('refresh_tokens');
    }
}
