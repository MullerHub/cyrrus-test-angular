import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LocalJourneyService } from '../../core/services/local-journey.service';

@Component({
  selector: 'app-child-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="child-selector-scroll">
      @for (child of data.children(); track child.id) {
        <button
          type="button"
          class="child-pill"
          [class.active]="child.id === data.getSelectedChildId()"
          (click)="data.setSelectedChild(child.id)"
        >
          <div class="avatar">{{ child.avatarLabel }}</div>
          <div>
            <p>{{ firstName(child.name) }}</p>
            <small>{{ data.formatAge(child.ageMonths) }}</small>
          </div>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .child-selector-scroll {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        padding: 0.25rem 0.1rem;
        scroll-snap-type: x mandatory;
      }

      .child-pill {
        min-width: 148px;
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--app-green) 35%, white);
        background:
          radial-gradient(circle at 90% 10%, color-mix(in srgb, var(--app-yellow) 38%, white) 0%, transparent 46%),
          #fffefa;
        padding: 0.7rem;
        display: flex;
        gap: 0.6rem;
        align-items: center;
        text-align: left;
        scroll-snap-align: start;
        box-shadow: 0 6px 18px rgba(71, 60, 51, 0.08);
      }

      .child-pill.active {
        border-color: color-mix(in srgb, var(--app-brown) 40%, white);
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(71, 60, 51, 0.16);
      }

      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: linear-gradient(
          145deg,
          color-mix(in srgb, var(--app-green) 64%, white),
          color-mix(in srgb, var(--app-yellow) 58%, white)
        );
        color: var(--app-brown);
        font-size: 0.72rem;
        font-weight: 700;
      }

      p {
        margin: 0;
        color: var(--app-brown);
        font-size: 0.86rem;
        font-weight: 700;
      }

      small {
        color: color-mix(in srgb, var(--app-brown) 72%, white);
      }
    `,
  ],
})
export class ChildSelectorComponent {
  readonly data = inject(LocalJourneyService);

  firstName(name: string): string {
    return name.split(' ')[0];
  }
}
