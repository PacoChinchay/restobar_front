import { Routes } from '@angular/router';
import { authGuard } from './presentation/shared/guards/auth.guard';
import { adminGuard } from './presentation/shared/guards/admin.guard';
import { roleGuard } from './presentation/shared/guards/role.guard';

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
        path: 'orders',
        loadComponent: () =>
          import('./presentation/features/orders/orders.component').then(m => m.OrdersComponent),
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./presentation/features/pos/pos.component').then(m => m.PosComponent),
      },
      {
        path: 'pos/:id',
        loadComponent: () =>
          import('./presentation/features/pos/pos.component').then(m => m.PosComponent),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./presentation/features/catalog/catalog.component').then(m => m.CatalogComponent),
        canActivate: [roleGuard('administrador', 'cajero')],
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./presentation/features/categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [adminGuard],
      },
      {
        path: 'menus',
        loadComponent: () =>
          import('./presentation/features/menus/menus.component').then(m => m.MenusComponent),
        canActivate: [adminGuard],
      },
      {
        path: 'cash-report',
        loadComponent: () =>
          import('./presentation/features/cash-report/cash-report.component').then(m => m.CashReportComponent),
        canActivate: [roleGuard('administrador', 'cajero')],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./presentation/features/users/users.component').then(m => m.UsersComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
