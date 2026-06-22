import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  IonBadge,
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
import { CampaignJourney } from '../../../core/models/journey.models';
import { LocalJourneyService } from '../../../core/services/local-journey.service';
import { ChildSelectorComponent } from '../../components/child-selector.component';

@Component({
  selector: 'app-campanhas-page',
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
    IonBadge,
    IonModal,
    IonButton,
    ChildSelectorComponent,
  ],
  templateUrl: './campanhas.page.html',
  styleUrls: ['./campanhas.page.scss'],
})
export class CampanhasPage {
  readonly data = inject(LocalJourneyService);
  readonly opened = signal<CampaignJourney | null>(null);

  readonly selected = computed(() => this.data.selectedChild());
  readonly campaigns = computed(() => this.data.getCampaignsForSelectedChild());

  open(campaign: CampaignJourney): void {
    this.opened.set(campaign);
  }

  close(): void {
    this.opened.set(null);
  }
}
