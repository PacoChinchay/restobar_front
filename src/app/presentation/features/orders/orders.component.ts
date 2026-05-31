import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Order } from '../../../core/domain/models/order.model';
import { PaymentMethod } from '../../../core/domain/models/sale.model';
import { GetOpenOrdersUseCase } from '../../../core/application/use-cases/get-open-orders.use-case';
import { PayOrderUseCase } from '../../../core/application/use-cases/pay-order.use-case';
import { CancelOrderUseCase } from '../../../core/application/use-cases/cancel-order.use-case';
import { AuthStore } from '../../../core/application/auth.store';

type OrderTab = 'mine' | 'all';

interface PayEntry {
  method: PaymentMethod;
  amount: number;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
};

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [Button, DecimalPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private getOpenOrders = inject(GetOpenOrdersUseCase);
  private payOrder = inject(PayOrderUseCase);
  private cancelOrder = inject(CancelOrderUseCase);
  readonly authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  readonly ALL_METHODS: PaymentMethod[] = ['efectivo', 'yape', 'plin', 'transferencia'];
  readonly PAYMENT_LABELS = PAYMENT_LABELS;

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly activeTab = signal<OrderTab>('mine');
  readonly payingOrderId = signal<number | null>(null);
  readonly payEntries = signal<PayEntry[]>([{ method: 'efectivo', amount: 0 }]);
  readonly paying = signal(false);

  readonly myOrders = computed(() => {
    const name = this.authStore.currentUser()?.name;
    if (!name) return this.orders();
    return this.orders().filter(o => o.createdBy === name);
  });

  readonly displayedOrders = computed(() =>
    this.activeTab() === 'mine' ? this.myOrders() : this.orders(),
  );

  readonly payingOrder = computed(() =>
    this.orders().find(o => o.id === this.payingOrderId()) ?? null,
  );

  readonly totalPaid = computed(() =>
    this.payEntries().reduce((s, e) => s + (e.amount || 0), 0),
  );

  readonly remaining = computed(() => {
    const order = this.payingOrder();
    if (!order) return 0;
    return Math.round((order.totalAmount - this.totalPaid()) * 100) / 100;
  });

  readonly change = computed(() => Math.max(0, Math.round(-this.remaining() * 100) / 100));

  readonly canConfirm = computed(() =>
    this.remaining() <= 0 && this.payEntries().some(e => e.amount > 0),
  );

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.loading.set(true);
    try {
      this.orders.set(await this.getOpenOrders.execute());
    } finally {
      this.loading.set(false);
    }
  }

  goToNewOrder() {
    this.router.navigate(['/carta']);
  }

  startPay(order: Order) {
    this.payingOrderId.set(order.id);
    this.payEntries.set([{ method: 'efectivo', amount: 0 }]);
  }

  cancelPay() {
    this.payingOrderId.set(null);
    this.payEntries.set([]);
  }

  addPayEntry() {
    const lastMethod = this.payEntries().at(-1)?.method ?? 'efectivo';
    const next: PaymentMethod = lastMethod === 'efectivo' ? 'yape' : 'efectivo';
    this.payEntries.update(entries => [...entries, { method: next, amount: 0 }]);
  }

  removePayEntry(i: number) {
    this.payEntries.update(entries => entries.filter((_, idx) => idx !== i));
  }

  setEntryMethod(i: number, method: PaymentMethod) {
    this.payEntries.update(entries =>
      entries.map((e, idx) => idx === i ? { ...e, method } : e),
    );
  }

  setEntryAmount(i: number, raw: string) {
    const amount = parseFloat(raw) || 0;
    this.payEntries.update(entries =>
      entries.map((e, idx) => idx === i ? { ...e, amount } : e),
    );
  }

  fillRemaining(i: number) {
    const rem = this.remaining();
    if (rem <= 0) return;
    const current = this.payEntries()[i]?.amount ?? 0;
    this.payEntries.update(entries =>
      entries.map((e, idx) => idx === i ? { ...e, amount: Math.round((current + rem) * 100) / 100 } : e),
    );
  }

  async confirmPay() {
    const order = this.payingOrder();
    if (!order || this.remaining() > 0.005 || this.paying()) return;
    this.paying.set(true);
    try {
      await this.payOrder.execute(order.id, {
        payments: this.payEntries()
          .filter(e => e.amount > 0)
          .map(e => ({ method: e.method, amount: e.amount })),
        registeredBy: this.authStore.currentUser()?.name ?? 'Desconocido',
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Comanda cobrada',
        detail: `Mesa ${order.tableNumber} — S/ ${order.totalAmount.toFixed(2)}`,
        life: 3000,
      });
      this.payingOrderId.set(null);
      await this.loadOrders();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al cobrar',
        detail: 'No se pudo procesar el pago. Intente nuevamente.',
        life: 5000,
      });
    } finally {
      this.paying.set(false);
    }
  }

  onCancelOrder(order: Order) {
    this.confirmationService.confirm({
      message: `¿Cancelar la comanda de Mesa ${order.tableNumber}? Quedará registrada en el sistema.`,
      header: 'Cancelar comanda',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.cancelOrder.execute(order.id);
          await this.loadOrders();
        } catch {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar la comanda.', life: 4000 });
        }
      },
    });
  }

  elapsed(createdAt: Date): string {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return 'ahora';
    if (diff === 1) return '1 min';
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    return `${h}h ${diff % 60}min`;
  }
}
