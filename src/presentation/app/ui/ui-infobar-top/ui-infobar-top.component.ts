import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-ui-infobar-top',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-infobar-top.component.html'
})
export class UiInfobarTopComponent implements OnInit {

  public constructor() {
    console.debug('UiInfobarTopComponent constructor called');
   }

  public ngOnInit(): void {
    console.debug('UiInfobarTopComponent ngOnInit called');
  }

}
