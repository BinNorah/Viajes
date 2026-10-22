import { Component } from '@angular/core';

import { ToastService } from '../toast.service';

@Component({
    selector: 'app-toasts',
    imports: [],
    templateUrl: './toasts.component.html',
    styleUrl: './toasts.component.css'
})
export class ToastsComponent {
  constructor(public toastService: ToastService) {}
}
