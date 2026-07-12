import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { QuotaGuard } from './quota.guard';
import { QuotaService } from './quota.service';

@Module({
  imports: [DbModule],
  providers: [QuotaService, QuotaGuard],
  exports: [QuotaService, QuotaGuard],
})
export class QuotaModule {}
