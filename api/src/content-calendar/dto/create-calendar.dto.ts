import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCalendarDto {
  @IsNotEmpty()
  @IsString()
  channelUrl!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  niche!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  preferences?: string;
}
