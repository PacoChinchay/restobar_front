import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { API_BASE } from '../adapters/http/api.base';

export interface StockUpdate {
  productId: number;
  remainingQuantity: number;
}

@Injectable({ providedIn: 'root' })
export class StockHubService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;
  readonly stockUpdates$ = new Subject<StockUpdate[]>();

  async connect(token: string): Promise<void> {
    if (this.connection &&
        this.connection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/stock`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('StockUpdated', (updates: StockUpdate[]) => {
      this.stockUpdates$.next(updates);
    });

    try {
      await this.connection.start();
    } catch (err) {
      console.warn('SignalR connection failed — real-time stock updates disabled:', err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  ngOnDestroy(): void {
    void this.disconnect();
  }
}
