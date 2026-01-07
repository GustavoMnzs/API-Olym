import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/global-api-key.guard';

// Decorator para marcar rotas como públicas (sem necessidade de API Key)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
