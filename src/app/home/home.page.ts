import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { Campaign, DashboardResponse, Family, VaccinationSituation } from '../core/models/domain.models';
import { MockApiService } from '../core/services/mock-api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
  ],
})
export class HomePage implements OnInit {
  private readonly mockApiService = inject(MockApiService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly dashboard = signal<DashboardResponse | null>(null);
  readonly families = signal<Family[]>([]);
  readonly campaigns = signal<Campaign[]>([]);

  ngOnInit(): void {
    this.loadInitialData();
  }

  doRefresh(event: CustomEvent): void {
    this.loadInitialData(() => event.detail.complete());
  }

  familyTrackBy(_index: number, family: Family): string {
    return family.id;
  }

  childTrackBy(_index: number, child: Family['children'][number]): string {
    return child.id;
  }

  campaignTrackBy(_index: number, campaign: Campaign): string {
    return campaign.id;
  }

  badgeClassBySituation(situation: VaccinationSituation): string {
    if (situation === 'OVERDUE') {
      return 'badge-overdue';
    }

    if (situation === 'PENDING') {
      return 'badge-pending';
    }

    return 'badge-applied';
  }

  formatSituation(situation: VaccinationSituation): string {
    if (situation === 'OVERDUE') {
      return 'Em atraso';
    }

    if (situation === 'PENDING') {
      return 'Pendente';
    }

    return 'Em dia';
  }

  private loadInitialData(onComplete?: () => void): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      dashboard: this.mockApiService.getDashboard(),
      families: this.mockApiService.getFamilies(),
      campaigns: this.mockApiService.getActiveCampaigns(),
    }).subscribe({
      next: (response) => {
        this.dashboard.set(response.dashboard);
        this.families.set(response.families);
        this.campaigns.set(response.campaigns);
        this.loading.set(false);
        onComplete?.();
      },
      error: () => {
        this.errorMessage.set('Nao foi possivel carregar os dados. Verifique se a mock API esta ativa.');
        this.loading.set(false);
        onComplete?.();
      },
    });
  }
}
