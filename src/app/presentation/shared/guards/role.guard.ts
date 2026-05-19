import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../../core/domain/models/user.model';
import { AuthStore } from '../../../core/application/auth.store';

export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);
    const role = store.currentUser()?.role;
    if (!role) return router.createUrlTree(['/login']);
    if ((allowed as string[]).includes(role)) return true;
    return router.createUrlTree(['/dashboard']);
  };
}
