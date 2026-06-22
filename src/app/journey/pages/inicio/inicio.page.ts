import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ChildJourney } from '../../../core/models/journey.models';
import { LocalJourneyService } from '../../../core/services/local-journey.service';
import { StatusBadgeComponent } from '../../components/status-badge.component';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonSpinner,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    StatusBadgeComponent,
  ],
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage {
  readonly data = inject(LocalJourneyService);
  private readonly router = inject(Router);
  readonly editingChild = signal<ChildJourney | null>(null);
  readonly formName = signal('');
  readonly formBirthDate = signal('');
  readonly formGender = signal<'M' | 'F'>('F');

  readonly kpis = computed(() => this.data.getDashboardKpis());
  readonly families = computed(() => this.data.getFamiliesWithChildren());

  openChildHistory(child: ChildJourney): void {
    this.data.setSelectedChild(child.id);
    void this.router.navigateByUrl('/historico');
  }

  openKpi(target: 'historico' | 'pendencias' | 'campanhas'): void {
    void this.router.navigateByUrl(`/${target}`);
  }

  openEditChild(child: ChildJourney): void {
    this.editingChild.set(child);
    this.formName.set(child.name);
    this.formBirthDate.set(child.birthDateIso ?? this.isoFromBrDate(child.birthDateLabel));
    this.formGender.set(child.gender ?? 'F');
  }

  closeEditChild(): void {
    this.editingChild.set(null);
  }

  saveChild(): void {
    const child = this.editingChild();

    if (!child || this.formName().trim().length < 2 || !this.formBirthDate()) {
      return;
    }

    this.data.updateChild(child.id, {
      name: this.formName().trim(),
      birthDate: this.formBirthDate(),
      gender: this.formGender(),
    });
    this.closeEditChild();
  }

  canSave(): boolean {
    return this.formName().trim().length >= 2 && !!this.formBirthDate();
  }

  situationOf(child: ChildJourney) {
    return this.data.getVaccinationSituation(child);
  }

  summaryOf(child: ChildJourney) {
    return this.data.getSummary(child);
  }

  private isoFromBrDate(value: string): string {
    if (!value || !value.includes('/')) {
      return '';
    }

    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }
}
