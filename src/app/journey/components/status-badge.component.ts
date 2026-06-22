import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DoseStatus, VaccinationSituation } from '../../core/models/journey.models';

type Tone = 'ok' | 'warn' | 'late';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-pill" [class.tone-ok]="resolvedTone === 'ok'" [class.tone-warn]="resolvedTone === 'warn'" [class.tone-late]="resolvedTone === 'late'">
      <span class="dot"></span>
      {{ label }}
    </span>
  `,
  styles: [
    `
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.26rem 0.62rem;
        border-radius: 999px;
        font-size: 0.68rem;
        letter-spacing: 0.02em;
        font-weight: 700;
        color: var(--app-brown);
        border: 1px solid transparent;
      }

      .dot {
        width: 0.38rem;
        height: 0.38rem;
        border-radius: 999px;
        background: currentColor;
      }

      .tone-ok {
        background: color-mix(in srgb, var(--app-green) 74%, white);
        color: #214619;
        border-color: color-mix(in srgb, var(--app-green) 52%, white);
      }

      .tone-warn {
        background: color-mix(in srgb, var(--app-yellow) 78%, white);
        color: var(--app-brown);
        border-color: color-mix(in srgb, var(--app-yellow) 52%, white);
      }

      .tone-late {
        background: color-mix(in srgb, var(--app-orange) 72%, white);
        color: #6a1717;
        border-color: color-mix(in srgb, var(--app-orange) 48%, white);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() dose?: DoseStatus;
  @Input() situation?: VaccinationSituation;
  @Input() toneInput?: Tone;
  @Input() customLabel?: string;

  get label(): string {
    if (this.customLabel) {
      return this.customLabel;
    }

    if (this.dose === 'APPLIED') {
      return 'Aplicada';
    }

    if (this.dose === 'PENDING') {
      return 'Pendente';
    }

    if (this.dose === 'OVERDUE') {
      return 'Atrasada';
    }

    if (this.situation === 'UP_TO_DATE') {
      return 'Em dia';
    }

    if (this.situation === 'DUE_SOON') {
      return 'Pendente';
    }

    if (this.situation === 'OVERDUE') {
      return 'Em atraso';
    }

    return 'Status';
  }

  get resolvedTone(): Tone {
    if (this.toneInput) {
      return this.toneInput;
    }

    if (this.dose === 'APPLIED') {
      return 'ok';
    }

    if (this.dose === 'PENDING') {
      return 'warn';
    }

    if (this.dose === 'OVERDUE') {
      return 'late';
    }

    if (this.situation === 'UP_TO_DATE') {
      return 'ok';
    }

    if (this.situation === 'DUE_SOON') {
      return 'warn';
    }

    if (this.situation === 'OVERDUE') {
      return 'late';
    }

    return 'ok';
  }
}
