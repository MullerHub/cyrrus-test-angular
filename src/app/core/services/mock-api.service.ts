import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Campaign, DashboardResponse, Family } from '../models/domain.models';
import { environment } from '../../../environments/environment';

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

  getActiveCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiBaseUrl}/campaigns/active`);
  }
}
