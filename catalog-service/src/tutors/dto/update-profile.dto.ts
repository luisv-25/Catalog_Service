import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  hourlyRate?: number;
}
