import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/styled';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { ProductRepositoryPort } from './core/domain/ports/product.repository.port';
import { SaleRepositoryPort } from './core/domain/ports/sale.repository.port';
import { AuthPort } from './core/domain/ports/auth.port';
import { MockProductRepository } from './infrastructure/adapters/mock/mock-product.repository';
import { MockSaleRepository } from './infrastructure/adapters/mock/mock-sale.repository';
import { MockAuthAdapter } from './infrastructure/adapters/mock/mock-auth.adapter';

const RestobarTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#FFF8EE',
      100: '#FFE9C2',
      200: '#FFD480',
      300: '#FFC043',
      400: '#F5A800',
      500: '#E88C00',
      600: '#CF7B00',
      700: '#B56900',
      800: '#9A5700',
      900: '#804500',
      950: '#5C3000',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: RestobarTheme,
        options: { prefix: 'p', darkModeSelector: false, cssLayer: false },
      },
      ripple: true,
    }),
    MessageService,
    ConfirmationService,
    { provide: ProductRepositoryPort, useClass: MockProductRepository },
    { provide: SaleRepositoryPort,    useClass: MockSaleRepository    },
    { provide: AuthPort,              useClass: MockAuthAdapter        },
  ],
};
