import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pasajero-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pasajero-form.component.html',
  styleUrl: './pasajero-form.component.css'
})
export class PasajeroFormComponent {
  @Input() pasajero: any = {};
  @Input() set p(valor: any) { this.pasajero = valor; }
  get p() { return this.pasajero; }
}
