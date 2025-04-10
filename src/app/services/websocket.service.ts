import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  private reconnectAttempts = 0; // Contador de tentativas de reconexão
  private maxReconnectAttempts = 5; // Número máximo de tentativas de reconexão
  private reconnectInterval = 5000; // Intervalo entre tentativas (5 segundos)
  private isManualClose = false; // Indica se a conexão foi fechada manualmente

  constructor() {
    this.connect();
  }

  // Conecta ao WebSocket
  private connect(): void {
    const token = localStorage.getItem('token');
    const isTvView = window.location.pathname.includes('tv-view');

    // Verifica se o token existe antes de adicioná-lo
    this.socket = isTvView || !token
      ? new WebSocket('wss://outdoor-backend-1.onrender.com') // Sem token para tv-view ou caso o token esteja ausente
      : new WebSocket('wss://outdoor-backend-1.onrender.com', [token]); // Com token para outras páginas

    //localhost:5000
    //outdoor-backend.onrender.com
    this.socket.addEventListener('open', () => {
      console.log('Conexão WebSocket estabelecida.');
      this.reconnectAttempts = 0;
    });

    this.socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      this.messageSubject.next(data);
    });

    this.socket.addEventListener('close', () => {
      if (!this.isManualClose) {
        console.log('Conexão WebSocket fechada. Tentando reconectar...');
        this.handleReconnect();
      }
    });

    this.socket.addEventListener('error', (error) => {
      console.error('Erro na conexão WebSocket:', error);
      this.socket?.close();
    });
  }



  // Lógica de reconexão
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Número máximo de tentativas de reconexão atingido.');
    }
  }

  // Fecha a conexão manualmente
  public closeConnection(): void {
    this.isManualClose = true;
    this.socket?.close();
  }

  // Retorna um Observable para escutar mensagens
  public getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  // Envia uma mensagem para o servidor (opcional)
  public sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket não está conectado.');
    }
  }
}
