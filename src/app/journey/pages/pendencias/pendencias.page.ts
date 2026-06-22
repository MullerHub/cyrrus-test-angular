import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { VaccineDoseRecord } from '../../../core/models/journey.models';
import { LocalJourneyService } from '../../../core/services/local-journey.service';
import { ChildSelectorComponent } from '../../components/child-selector.component';
import { StatusBadgeComponent } from '../../components/status-badge.component';

@Component({
  selector: 'app-pendencias-page',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonModal,
    IonButton,
    ChildSelectorComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './pendencias.page.html',
  styleUrls: ['./pendencias.page.scss'],
})
export class PendenciasPage {
  readonly data = inject(LocalJourneyService);
  readonly opened = signal<VaccineDoseRecord | null>(null);

  readonly selected = computed(() => this.data.selectedChild());
  readonly overdueVaccines = computed(() => this.data.getOverdueVaccines(this.selected()));
  readonly pendingVaccines = computed(() => this.data.getPendingVaccines(this.selected()));

  open(vaccine: VaccineDoseRecord): void {
    this.opened.set(vaccine);
  }

  close(): void {
    this.opened.set(null);
  }
}
