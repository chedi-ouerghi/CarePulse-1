import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
})
export class AlertGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AlertGateway.name);
  private readonly patientSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.query?.token as string;

    if (!token) {
      this.logger.warn(`Client ${client.id} rejected: no token`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const patientId = payload.sub as string;
      if (!patientId) {
        this.logger.warn(`Client ${client.id} rejected: invalid token payload`);
        client.disconnect();
        return;
      }
      (client as any).userId = payload.sub;
      (client as any).userRole = payload.role;

      if (!this.patientSockets.has(patientId)) {
        this.patientSockets.set(patientId, new Set());
      }
      this.patientSockets.get(patientId)!.add(client.id);
      client.join(`patient:${patientId}`);
      this.logger.log(
        `Client ${client.id} authenticated and joined room patient:${patientId}`
      );
    } catch (err) {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const patientId = client.handshake.query.patientId as string;
    if (patientId) {
      const sockets = this.patientSockets.get(patientId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.patientSockets.delete(patientId);
        }
      }
    }
  }

  notifyPatient(patientId: string, event: string, payload: unknown) {
    this.server.to(`patient:${patientId}`).emit(event, payload);
    this.logger.log(
      `Emitted ${event} to patient:${patientId}`
    );
  }
}
