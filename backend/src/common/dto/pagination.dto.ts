import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    get skip(): number {
        const currentPage = this.page ?? 1;
        const currentLimit = this.limit ?? 10;
        return (currentPage - 1) * currentLimit;
    }
}
