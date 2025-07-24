import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // Recherche générale

  @IsOptional()
  @IsString()
  sortBy?: string; // Champ de tri

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC'; // Ordre de tri

  @IsOptional()
  @IsDateString()
  startDate?: string; // Filtrage par date

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string; // Filtrage par statut

  @IsOptional()
  @IsString()
  category?: string; // Filtrage par catégorie
}