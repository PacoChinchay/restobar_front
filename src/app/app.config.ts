import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './infrastructure/http/auth.interceptor';
import { MessageService, ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/styled';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { ProductRepositoryPort } from './core/domain/ports/product.repository.port';
import { SaleRepositoryPort } from './core/domain/ports/sale.repository.port';
import { AuthPort } from './core/domain/ports/auth.port';
import { CategoryRepositoryPort } from './core/domain/ports/category.repository.port';
import { OrderRepositoryPort } from './core/domain/ports/order.repository.port';
import { MenuRepositoryPort } from './core/domain/ports/menu.repository.port';
import { WaiterReportPort } from './core/domain/ports/waiter-report.port';
import { HttpProductRepository } from './infrastructure/adapters/http/http-product.repository';
import { HttpSaleRepository } from './infrastructure/adapters/http/http-sale.repository';
import { HttpAuthAdapter } from './infrastructure/adapters/http/http-auth.adapter';
import { HttpCategoryRepository } from './infrastructure/adapters/http/http-category.repository';
import { HttpOrderRepository } from './infrastructure/adapters/http/http-order.repository';
import { HttpMenuRepository } from './infrastructure/adapters/http/http-menu.repository';
import { HttpWaiterReportAdapter } from './infrastructure/adapters/http/http-waiter-report.adapter';

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
    provideHttpClient(withInterceptors([authInterceptor])),
    MessageService,
    ConfirmationService,
    { provide: ProductRepositoryPort,  useClass: HttpProductRepository  },
    { provide: SaleRepositoryPort,     useClass: HttpSaleRepository     },
    { provide: AuthPort,               useClass: HttpAuthAdapter         },
    { provide: CategoryRepositoryPort, useClass: HttpCategoryRepository  },
    { provide: OrderRepositoryPort,    useClass: HttpOrderRepository     },
    { provide: MenuRepositoryPort,     useClass: HttpMenuRepository      },
    { provide: WaiterReportPort,       useClass: HttpWaiterReportAdapter  },
  ],
};
