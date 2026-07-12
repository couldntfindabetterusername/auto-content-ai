import { Global, Module } from '@nestjs/common';
import { createDb } from './index';

const DB_PROVIDER = {
  provide: 'DB',
  useFactory: () => createDb(),
};

@Global()
@Module({
  providers: [DB_PROVIDER],
  exports: [DB_PROVIDER],
})
export class DbModule {}
