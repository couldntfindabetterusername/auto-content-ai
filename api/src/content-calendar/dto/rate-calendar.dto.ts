import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RateCalendarDto {
  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  feedback?: string;
}
