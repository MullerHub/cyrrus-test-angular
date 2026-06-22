import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Campaign, Child, Family, VaccinationHistoryItem } from '../models/domain.models';
import {
  CampaignJourney,
  ChildJourney,
  ChildStatusSummary,
  DoseStatus,
  FamilyJourney,
  JourneyKpis,
  VaccineDoseRecord,
  VaccinationSituation,
} from '../models/journey.models';
import { MockApiService, UpdateChildPayload } from './mock-api.service';

@Injectable({
  providedIn: 'root',
})
export class LocalJourneyService {
  private readonly api = inject(MockApiService);

  private readonly emptyChild: ChildJourney = {
    id: 'loading',
    familyId: '',
    name: 'Carregando',
    ageMonths: 0,
    birthDateLabel: '',
    avatarLabel: 'LD',
    triage: 'CLEAR',
    vaccines: [],
    summary: { applied: 0, pending: 0, overdue: 0 },
    situation: 'UP_TO_DATE',
  };

  private readonly familiesState = signal<FamilyJourney[]>([]);
  private readonly childrenState = signal<ChildJourney[]>([]);
  private readonly campaignsByChildState = signal<Record<string, CampaignJourney[]>>({});
  private readonly historyByChildState = signal<Record<string, VaccineDoseRecord[]>>({});
  private readonly dashboardState = signal<JourneyKpis>({
    families: 0,
    children: 0,
    overdue: 0,
    activeCampaigns: 0,
  });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly savingChildIds = signal<string[]>([]);

  readonly children = computed(() => this.childrenState());
  readonly families = computed(() => this.familiesState());

  private readonly selectedChildId = signal('');

  readonly selectedChild = computed(() => {
    const selected = this.childrenState().find((child) => child.id === this.selectedChildId());
    return selected ?? this.childrenState()[0] ?? this.emptyChild;
  });

  constructor() {
    this.loadBaseData();
  }

  reload(): void {
    this.loadBaseData();
  }

  updateChild(childId: string, payload: UpdateChildPayload): void {
    if (!this.childrenState().some((child) => child.id === childId)) {
      return;
    }

    this.savingChildIds.update((ids) => (ids.includes(childId) ? ids : [...ids, childId]));

    this.api.updateChild(childId, payload).subscribe({
      next: (updatedChild) => {
        this.childrenState.update((children) =>
          children.map((child) => (child.id === childId ? this.mapChild(updatedChild) : child))
        );
        this.savingChildIds.update((ids) => ids.filter((id) => id !== childId));
      },
      error: () => {
        this.savingChildIds.update((ids) => ids.filter((id) => id !== childId));
      },
    });
  }

  isSavingChild(childId: string): boolean {
    return this.savingChildIds().includes(childId);
  }

  setSelectedChild(id: string): void {
    if (this.childrenState().some((child) => child.id === id)) {
      this.selectedChildId.set(id);
      this.ensureChildDataLoaded(id);
    }
  }

  getSelectedChildId(): string {
    return this.selectedChildId();
  }

  getFamiliesWithChildren(): Array<FamilyJourney & { children: ChildJourney[] }> {
    const children = this.childrenState();

    return this.familiesState().map((family) => ({
      ...family,
      children: children.filter((child) => child.familyId === family.id),
    }));
  }

  getDoseStatus(vaccine: VaccineDoseRecord): DoseStatus {
    if (vaccine.status) {
      return vaccine.status;
    }

    if (vaccine.appliedDate) {
      return 'APPLIED';
    }

    if (!vaccine.scheduledDate) {
      return 'PENDING';
    }

    const scheduled = this.parseIsoDate(vaccine.scheduledDate);
    return scheduled.getTime() < Date.now() ? 'OVERDUE' : 'PENDING';
  }

  getSummary(child: ChildJourney): ChildStatusSummary {
    if (child.summary) {
      return child.summary;
    }

    return child.vaccines.reduce(
      (summary, vaccine) => {
        const status = this.getDoseStatus(vaccine);

        if (status === 'APPLIED') {
          summary.applied += 1;
        } else if (status === 'PENDING') {
          summary.pending += 1;
        } else {
          summary.overdue += 1;
        }

        return summary;
      },
      {
        applied: 0,
        pending: 0,
        overdue: 0,
      }
    );
  }

  getVaccinationSituation(child: ChildJourney): VaccinationSituation {
    if (child.situation) {
      return child.situation;
    }

    const summary = this.getSummary(child);

    if (summary.overdue > 0) {
      return 'OVERDUE';
    }

    if (summary.pending > 0) {
      return 'DUE_SOON';
    }

    return 'UP_TO_DATE';
  }

  getStatusSummaryLabel(child: ChildJourney): string {
    const summary = this.getSummary(child);

    if (summary.overdue > 0) {
      return `${summary.overdue} dose(s) em atraso`;
    }

    if (summary.pending > 0) {
      return `${summary.pending} dose(s) pendente(s)`;
    }

    return 'Carteira em dia';
  }

  getDashboardKpis(): JourneyKpis {
    return this.dashboardState();
  }

  getAppliedVaccines(child: ChildJourney): VaccineDoseRecord[] {
    return this.getChildVaccines(child.id)
      .filter((vaccine) => this.getDoseStatus(vaccine) === 'APPLIED')
      .sort((a, b) => (b.appliedDate ?? '').localeCompare(a.appliedDate ?? ''));
  }

  getPendingVaccines(child: ChildJourney): VaccineDoseRecord[] {
    return this.getChildVaccines(child.id)
      .filter((vaccine) => this.getDoseStatus(vaccine) === 'PENDING')
      .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));
  }

  getOverdueVaccines(child: ChildJourney): VaccineDoseRecord[] {
    return this.getChildVaccines(child.id)
      .filter((vaccine) => this.getDoseStatus(vaccine) === 'OVERDUE')
      .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));
  }

  getActiveCampaigns(): CampaignJourney[] {
    const selectedId = this.getSelectedChildId();
    return this.campaignsByChildState()[selectedId] ?? [];
  }

  campaignAppliesToChild(campaign: CampaignJourney, child: ChildJourney): boolean {
    return child.ageMonths >= campaign.targetMinAgeMonths && child.ageMonths <= campaign.targetMaxAgeMonths;
  }

  getCampaignsForSelectedChild(): CampaignJourney[] {
    return this.getActiveCampaigns();
  }

  getRemainingDays(campaign: CampaignJourney): number {
    const end = this.parseIsoDate(campaign.endDate).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
  }

  formatDateBr(date?: string): string {
    if (!date) {
      return '';
    }

    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  formatAge(months: number): string {
    if (months < 12) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }

    const years = Math.floor(months / 12);
    const restMonths = months % 12;
    const yearsLabel = `${years} ${years === 1 ? 'ano' : 'anos'}`;

    return restMonths === 0
      ? yearsLabel
      : `${yearsLabel} e ${restMonths} ${restMonths === 1 ? 'mes' : 'meses'}`;
  }

  private getChildVaccines(childId: string): VaccineDoseRecord[] {
    return this.historyByChildState()[childId] ?? [];
  }

  private loadBaseData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      dashboard: this.api.getDashboard(),
      families: this.api.getFamilies(),
      children: this.api.getChildren(),
    }).subscribe({
      next: ({ dashboard, families, children }) => {
        const parsedChildren = children.map((child) => this.mapChild(child));
        const firstChildId = parsedChildren[0]?.id ?? '';

        this.dashboardState.set({
          families: dashboard.totals.families,
          children: dashboard.totals.children,
          overdue: dashboard.totals.overdue,
          activeCampaigns: dashboard.totals.activeCampaigns,
        });

        this.familiesState.set(families.map((family) => this.mapFamily(family)));
        this.childrenState.set(parsedChildren);
        this.selectedChildId.set(firstChildId);
        this.historyByChildState.set({});
        this.campaignsByChildState.set({});

        if (parsedChildren.length > 0) {
          parsedChildren.forEach((child) => this.ensureChildDataLoaded(child.id));
        }

        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Nao foi possivel carregar a mock API. Confirme se ela esta ativa em http://localhost:3333.');
        this.loading.set(false);
      },
    });
  }

  private ensureChildDataLoaded(childId: string): void {
    if (!this.historyByChildState()[childId]) {
      this.api.getChildVaccinationHistory(childId).subscribe({
        next: (history) => {
          this.historyByChildState.update((cache) => ({
            ...cache,
            [childId]: history.map((item) => this.mapHistory(item)),
          }));
        },
      });
    }

    if (!this.campaignsByChildState()[childId]) {
      this.api.getActiveCampaignsForChild(childId).subscribe({
        next: (campaigns) => {
          this.campaignsByChildState.update((cache) => ({
            ...cache,
            [childId]: campaigns.map((campaign) => this.mapCampaign(campaign)),
          }));
        },
      });
    }
  }

  private mapFamily(family: Family): FamilyJourney {
    return {
      id: family.id,
      familyName: family.familyName,
      responsibleName: family.responsibleName,
      city: family.city,
    };
  }

  private mapChild(child: Child): ChildJourney {
    return {
      id: child.id,
      familyId: child.familyId,
      name: child.name,
      gender: child.gender,
      ageMonths: child.ageMonths,
      birthDateIso: child.birthDate,
      birthDateLabel: this.formatDateBr(child.birthDate),
      avatarLabel: this.initials(child.name),
      triage: 'CLEAR',
      vaccines: [],
      situation: this.fromApiSituation(child.vaccinationSituation),
      summary: {
        applied: child.statusSummary.APPLIED,
        pending: child.statusSummary.PENDING,
        overdue: child.statusSummary.OVERDUE,
      },
    };
  }

  private mapCampaign(campaign: Campaign): CampaignJourney {
    return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      targetMinAgeMonths: campaign.targetMinAgeMonths,
      targetMaxAgeMonths: campaign.targetMaxAgeMonths,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      location: 'Postos de saude e UBS',
    };
  }

  private mapHistory(item: VaccinationHistoryItem): VaccineDoseRecord {
    const doseLabel = item.doseNumber ? `${item.doseNumber}a dose` : 'Dose';

    return {
      id: item.id,
      name: item.vaccineName ?? 'Vacina',
      doseLabel,
      appliedDate: item.appliedDate ?? undefined,
      scheduledDate: item.scheduledDate,
      location: item.healthUnit ?? undefined,
      status: item.status,
    };
  }

  private fromApiSituation(situation: 'APPLIED' | 'PENDING' | 'OVERDUE'): VaccinationSituation {
    if (situation === 'OVERDUE') {
      return 'OVERDUE';
    }

    if (situation === 'PENDING') {
      return 'DUE_SOON';
    }

    return 'UP_TO_DATE';
  }

  private initials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  private parseIsoDate(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }
}
