import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class AddSubjectDto {
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number;
}
