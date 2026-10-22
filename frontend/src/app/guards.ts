import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Api } from './api.service';
export const roleGuard = (roles: string[] = []): CanActivateFn => async () => {
  const api = inject(Api), router = inject(Router);
  await api.ready;
  const u = api.user();
  if (u && (!roles.length || roles.includes(u.rol))) return true;
  return router.parseUrl('/login');
};
