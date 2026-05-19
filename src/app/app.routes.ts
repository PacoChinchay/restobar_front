import { Routes } from '@angular/router';
import { authGuard } from './presentation/shared/guards/auth.guard';
import { adminGuard } from './presentation/shared/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./presentation/layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./presentation/features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'sales/new',
        loadComponent: () =>
          import('./presentation/features/sales/new-sale/new-sale.component').then(m => m.NewSaleComponent),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./presentation/features/catalog/catalog.component').then(m => m.CatalogComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./presentation/features/categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [adminGuard],
      },
      {
        path: 'cash-report',
        loadComponent: () =>
          import('./presentation/features/cash-report/cash-report.component').then(m => m.CashReportComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
