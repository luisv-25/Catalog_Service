import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;
}
