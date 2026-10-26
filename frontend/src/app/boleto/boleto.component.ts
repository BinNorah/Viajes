import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boleto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boleto.component.html',
  styleUrl: './boleto.component.css'
})
export class BoletoComponent {
  @Input() boleto: any;
  @Input() set b(valor: any) { this.boleto = valor; }
  get b() { return this.boleto; }

  formatearNumero(valor: any): string {
    return Number(valor || 0).toFixed(2);
  }

  numero(valor: any): string {
    return this.formatearNumero(valor);
  }

  imprimir(): void {
    window.print();
  }
}
