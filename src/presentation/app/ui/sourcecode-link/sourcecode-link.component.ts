import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'sourcecode-link',
    standalone: true,
    templateUrl: './sourcecode-link.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule
    ]
})
export class SourcecodeLinkComponent implements OnInit {

  public constructor() { 
    console.debug('UiComponent constructor called');
  }

  public ngOnInit(): void {
    console.debug('UiComponent ngOnInit called');
  }

}
