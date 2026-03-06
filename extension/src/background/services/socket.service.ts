type MessageCallback = (data: any) => void;

class SocketService {
    private ws: WebSocket | null = null;
    private url: string = 'ws://161.97.107.249:8000/api/v1/ws';
    private reconnectInterval = 5000;
    private listeners: MessageCallback[] = [];

    connect(userId: string) {
        if (this.ws) return;

        this.ws = new WebSocket(`${this.url}/${userId}`);

        this.ws.onopen = () => {
            console.log('[CreatorShield] WS Connected');
        };

        this.ws.onmessage = (event) => {
            console.log('[CreatorShield] WS Message:', event.data);
            try {
                const data = JSON.parse(event.data);
                this.notifyListeners(data);
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        this.ws.onclose = () => {
            console.log('[CreatorShield] WS Disconnected');
            this.ws = null;
            setTimeout(() => this.connect(userId), this.reconnectInterval);
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    subscribe(callback: MessageCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(data: any) {
        this.listeners.forEach(l => l(data));
    }
}

export const socketService = new SocketService();
