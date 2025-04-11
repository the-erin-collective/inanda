import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-ui-infobar-bottom',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-infobar-bottom.component.html'
})
export class UiInfobarBottomComponent implements OnInit {

  public constructor() { 
    console.debug('UiInfobarBottomComponent constructor called');
  }

  public ngOnInit(): void {
    console.debug('UiInfobarBottomComponent ngOnInit called');
  }

}
