import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Campaign, Child, DashboardResponse, Family, StatusSummary, VaccinationHistoryItem, VaccinationSituation } from '../models/domain.models';
import { STATIC_DATA } from '../mocks/static-data';

export interface UpdateChildPayload {
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
}

@Injectable({
  providedIn: 'root',
})
export class MockApiService {
  private readonly db: MockDatabase = JSON.parse(JSON.stringify(STATIC_DATA));

  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  getDashboard(): Observable<DashboardResponse> {
    const parsedChildren = this.db.children.map((item) => this.childWithSituation(item));
    const childApplications = this.db.vaccineApplications.map((item) => this.hydrateApplication(item));

    return of({
      totals: {
        families: this.db.families.length,
        children: parsedChildren.length,
        applied: childApplications.filter((item) => item.status === 'APPLIED').length,
        pending: childApplications.filter((item) => item.status === 'PENDING').length,
        overdue: childApplications.filter((item) => item.status === 'OVERDUE').length,
        activeCampaigns: this.db.vaccinationCampaigns
          .map((item) => this.campaignWithMeta(item))
          .filter((item) => item.active).length,
      },
      childrenBySituation: {
        APPLIED: parsedChildren.filter((item) => item.vaccinationSituation === 'APPLIED').length,
        PENDING: parsedChildren.filter((item) => item.vaccinationSituation === 'PENDING').length,
        OVERDUE: parsedChildren.filter((item) => item.vaccinationSituation === 'OVERDUE').length,
      },
    });
  }

  getFamilies(): Observable<Family[]> {
    const parsed = this.db.families.map((family) => {
      const familyChildren = this.db.children
        .filter((item) => item.familyId === family.id)
        .map((item) => this.childWithSituation(item));

      return {
        ...family,
        childrenCount: familyChildren.length,
        children: familyChildren,
      };
    });

    return of(parsed);
  }

  getChildren(): Observable<Child[]> {
    return of(this.db.children.map((item) => this.childWithSituation(item)));
  }

  getChildVaccinationHistory(childId: string): Observable<VaccinationHistoryItem[]> {
    const child = this.db.children.find((item) => item.id === childId);

    if (!child) {
      return throwError(() => new Error('Crianca nao encontrada.'));
    }

    return of(this.getChildApplications(childId));
  }

  getActiveCampaigns(): Observable<Campaign[]> {
    const active = this.db.vaccinationCampaigns
      .map((item) => this.campaignWithMeta(item))
      .filter((item) => item.active);

    return of(active);
  }

  getActiveCampaignsForChild(childId: string): Observable<Campaign[]> {
    const child = this.db.children.find((item) => item.id === childId);

    if (!child) {
      return throwError(() => new Error('Crianca nao encontrada.'));
    }

    const ageMonths = this.getAgeInMonths(child.birthDate);
    const active = this.db.vaccinationCampaigns
      .map((item) => this.campaignWithMeta(item))
      .filter((item) => item.active)
      .filter((item) => {
        const min = item.targetMinAgeMonths ?? 0;
        const max = item.targetMaxAgeMonths ?? 999;
        return ageMonths >= min && ageMonths <= max;
      });

    return of(active);
  }

  updateChild(childId: string, payload: UpdateChildPayload): Observable<Child> {
    const child = this.db.children.find((item) => item.id === childId);

    if (!child) {
      return throwError(() => new Error('Crianca nao encontrada.'));
    }

    if (!payload.name || payload.name.trim().length < 2) {
      return throwError(() => new Error('Nome invalido.'));
    }

    if (!payload.birthDate || Number.isNaN(this.normalizeDateOnly(payload.birthDate).getTime())) {
      return throwError(() => new Error('Data de nascimento invalida.'));
    }

    if (!['M', 'F'].includes(payload.gender)) {
      return throwError(() => new Error('Genero invalido.'));
    }

    child.name = payload.name.trim();
    child.birthDate = payload.birthDate;
    child.gender = payload.gender;

    return of(this.childWithSituation(child));
  }

  private normalizeDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
  }

  private getAgeInMonths(birthDate: string): number {
    const now = new Date();
    const birth = this.normalizeDateOnly(birthDate);

    const yearDiff = now.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
    const dayDiff = now.getUTCDate() - birth.getUTCDate();

    let total = yearDiff * 12 + monthDiff;
    if (dayDiff < 0) {
      total -= 1;
    }

    return Math.max(total, 0);
  }

  private getApplicationStatus(application: RawApplication): VaccinationSituation {
    if (application.appliedDate) {
      return 'APPLIED';
    }

    const today = this.normalizeDateOnly(new Date().toISOString().slice(0, 10));
    const scheduled = this.normalizeDateOnly(application.scheduledDate);

    if (scheduled < today) {
      return 'OVERDUE';
    }

    return 'PENDING';
  }

  private hydrateApplication(application: RawApplication): VaccinationHistoryItem {
    const dose = this.db.vaccineDoses.find((item) => item.id === application.vaccineDoseId);
    const vaccine = dose ? this.db.vaccines.find((item) => item.id === dose.vaccineId) : null;
    const preMap = application.preVaccinationMapId
      ? this.db.preVaccinationMaps.find((item) => item.id === application.preVaccinationMapId)
      : null;
    const campaign = application.campaignId
      ? this.db.vaccinationCampaigns.find((item) => item.id === application.campaignId)
      : null;

    return {
      ...application,
      status: this.getApplicationStatus(application),
      vaccineName: vaccine ? vaccine.name : null,
      vaccineId: vaccine ? vaccine.id : null,
      doseNumber: dose ? dose.doseNumber : null,
      preVaccinationRecommendation: preMap ? preMap.recommendation : null,
      campaignTitle: campaign ? campaign.title : null,
    };
  }

  private getChildApplications(childId: string): VaccinationHistoryItem[] {
    return this.db.vaccineApplications
      .filter((item) => item.childId === childId)
      .map((item) => this.hydrateApplication(item))
      .sort(
        (a, b) =>
          this.normalizeDateOnly(a.scheduledDate).getTime() - this.normalizeDateOnly(b.scheduledDate).getTime()
      );
  }

  private summarizeStatus(applications: VaccinationHistoryItem[]): StatusSummary {
    return applications.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      {
        total: 0,
        APPLIED: 0,
        PENDING: 0,
        OVERDUE: 0,
      }
    );
  }

  private childWithSituation(child: RawChild): Child {
    const applications = this.getChildApplications(child.id);
    const statusSummary = this.summarizeStatus(applications);

    let vaccinationSituation: VaccinationSituation = 'APPLIED';
    if (statusSummary.OVERDUE > 0) {
      vaccinationSituation = 'OVERDUE';
    } else if (statusSummary.PENDING > 0) {
      vaccinationSituation = 'PENDING';
    }

    return {
      ...child,
      ageMonths: this.getAgeInMonths(child.birthDate),
      vaccinationSituation,
      statusSummary,
    };
  }

  private campaignWithMeta(campaign: RawCampaign): Campaign {
    const today = this.normalizeDateOnly(new Date().toISOString().slice(0, 10));
    const start = this.normalizeDateOnly(campaign.startDate);
    const end = this.normalizeDateOnly(campaign.endDate);

    const vaccineIds = this.db.campaignVaccines
      .filter((item) => item.campaignId === campaign.id)
      .map((item) => item.vaccineId);

    const vaccinesInCampaign = this.db.vaccines.filter((item) => vaccineIds.includes(item.id));

    return {
      ...campaign,
      active: start <= today && today <= end,
      remainingDays: Math.max(Math.ceil((end.getTime() - today.getTime()) / this.MS_PER_DAY), 0),
      vaccines: vaccinesInCampaign,
    };
  }
}

type RawFamily = {
  id: string;
  familyName: string;
  responsibleName: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
};

type RawChild = {
  id: string;
  familyId: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
};

type RawVaccine = {
  id: string;
  name: string;
  disease: string;
  notes: string;
  active: boolean;
};

type RawVaccineDose = {
  id: string;
  vaccineId: string;
  doseNumber: number;
};

type RawApplication = {
  id: string;
  childId: string;
  vaccineDoseId: string;
  scheduledDate: string;
  appliedDate: string | null;
  status: VaccinationSituation;
  batchNumber: string | null;
  healthUnit: string | null;
  preVaccinationMapId: string | null;
  campaignId: string | null;
};

type RawCampaign = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetMinAgeMonths: number;
  targetMaxAgeMonths: number;
};

type RawCampaignVaccine = {
  campaignId: string;
  vaccineId: string;
};

type RawPreVaccinationMap = {
  id: string;
  recommendation: 'CLEAR' | 'ATTENTION' | 'BLOCKED';
};

type MockDatabase = {
  families: RawFamily[];
  children: RawChild[];
  vaccines: RawVaccine[];
  vaccineDoses: RawVaccineDose[];
  vaccineApplications: RawApplication[];
  vaccinationCampaigns: RawCampaign[];
  campaignVaccines: RawCampaignVaccine[];
  preVaccinationMaps: RawPreVaccinationMap[];
};
