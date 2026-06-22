export type VaccinationSituation = 'APPLIED' | 'PENDING' | 'OVERDUE';

export interface StatusSummary {
  total: number;
  APPLIED: number;
  PENDING: number;
  OVERDUE: number;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
  ageMonths: number;
  vaccinationSituation: VaccinationSituation;
  statusSummary: StatusSummary;
}

export interface Family {
  id: string;
  familyName: string;
  responsibleName: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  childrenCount: number;
  children: Child[];
}

export interface Vaccine {
  id: string;
  name: string;
  disease: string;
  notes: string;
  active: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetMinAgeMonths: number;
  targetMaxAgeMonths: number;
  active: boolean;
  remainingDays: number;
  vaccines: Vaccine[];
}

export interface DashboardTotals {
  families: number;
  children: number;
  applied: number;
  pending: number;
  overdue: number;
  activeCampaigns: number;
}

export interface DashboardChildrenBySituation {
  APPLIED: number;
  PENDING: number;
  OVERDUE: number;
}

export interface DashboardResponse {
  totals: DashboardTotals;
  childrenBySituation: DashboardChildrenBySituation;
}
