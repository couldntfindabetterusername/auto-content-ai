import { IsEnum, IsInt, Max, Min } from 'class-validator';

export type RegenerateSection = 'titles' | 'hook' | 'outline' | 'seo' | 'thumbnail' | 'full_concept';

export class RegenerateSectionDto {
  @IsEnum(['titles', 'hook', 'outline', 'seo', 'thumbnail', 'full_concept'])
  section!: RegenerateSection;

  @IsInt()
  @Min(0)
  @Max(3)
  videoIndex!: number;
}
