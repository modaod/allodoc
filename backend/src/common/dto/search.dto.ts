import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // General search

  @IsOptional()
  @IsString()
  sortBy?: string; // Sort field

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC'; // Sort order

  @IsOptional()
  @IsDateString()
  startDate?: string; // Date filtering

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string; // Status filtering

  @IsOptional()
  @IsString()
  category?: string; // Category
}
