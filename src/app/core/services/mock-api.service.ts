import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Campaign, Child, DashboardResponse, Family, VaccinationHistoryItem } from '../models/domain.models';
import { environment } from '../../../environments/environment';

export interface UpdateChildPayload {
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
}

@Injectable({
  providedIn: 'root',
})
export class MockApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.mockApiBaseUrl;

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiBaseUrl}/dashboard`);
  }

  getFamilies(): Observable<Family[]> {
    return this.http.get<Family[]>(`${this.apiBaseUrl}/families`);
  }

  getChildren(): Observable<Child[]> {
    return this.http.get<Child[]>(`${this.apiBaseUrl}/children`);
  }

  getChildVaccinationHistory(childId: string): Observable<VaccinationHistoryItem[]> {
    return this.http.get<VaccinationHistoryItem[]>(`${this.apiBaseUrl}/children/${childId}/vaccination-history`);
  }

  getActiveCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiBaseUrl}/campaigns/active`);
  }

  getActiveCampaignsForChild(childId: string): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiBaseUrl}/campaigns/active?childId=${childId}`);
  }

  updateChild(childId: string, payload: UpdateChildPayload): Observable<Child> {
    return this.http.put<Child>(`${this.apiBaseUrl}/children/${childId}`, payload);
  }
}
