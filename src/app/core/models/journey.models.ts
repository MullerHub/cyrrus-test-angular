export type DoseStatus = 'APPLIED' | 'PENDING' | 'OVERDUE';
export type VaccinationSituation = 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE';
export type TriageRecommendation = 'CLEAR' | 'ATTENTION' | 'BLOCKED';

export interface VaccineDoseRecord {
  id: string;
  name: string;
  doseLabel: string;
  appliedDate?: string;
  scheduledDate?: string;
  location?: string;
  status?: DoseStatus;
}

export interface ChildJourney {
  id: string;
  familyId: string;
  name: string;
  gender?: 'M' | 'F';
  ageMonths: number;
  birthDateIso?: string;
  birthDateLabel: string;
  avatarLabel: string;
  triage: TriageRecommendation;
  vaccines: VaccineDoseRecord[];
  situation?: VaccinationSituation;
  summary?: ChildStatusSummary;
}

export interface FamilyJourney {
  id: string;
  familyName: string;
  responsibleName: string;
  city: string;
}

export interface CampaignJourney {
  id: string;
  title: string;
  description: string;
  targetMinAgeMonths: number;
  targetMaxAgeMonths: number;
  startDate: string;
  endDate: string;
  location: string;
}

export interface ChildStatusSummary {
  applied: number;
  pending: number;
  overdue: number;
}

export interface JourneyKpis {
  families: number;
  children: number;
  overdue: number;
  activeCampaigns: number;
}
