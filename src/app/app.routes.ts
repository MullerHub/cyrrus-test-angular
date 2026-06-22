import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./journey/pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./journey/pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'historico',
        loadComponent: () => import('./journey/pages/historico/historico.page').then((m) => m.HistoricoPage),
      },
      {
        path: 'pendencias',
        loadComponent: () => import('./journey/pages/pendencias/pendencias.page').then((m) => m.PendenciasPage),
      },
      {
        path: 'campanhas',
        loadComponent: () => import('./journey/pages/campanhas/campanhas.page').then((m) => m.CampanhasPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
