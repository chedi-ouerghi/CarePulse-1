import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  },
  namespace: "/",
  transports: ["websocket", "polling"],
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AlertsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        this.logger.warn("Client connected without token, disconnecting");
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store userId on the socket for later use
      client.data.userId = userId;
      client.data.role = payload.role;

      // Join a room based on userId for targeted emissions
      client.join(`user:${userId}`);

      // If clinician, also join clinician room
      if (payload.role === "CLINICIAN") {
        const clinician = await this.prisma.clinician.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (clinician) {
          client.data.clinicianId = clinician.id;
          client.join(`clinician:${clinician.id}`);
        }
      }

      // If patient, also join patient room
      if (payload.role === "PATIENT") {
        const patient = await this.prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (patient) {
          client.data.patientId = patient.id;
          client.join(`patient:${patient.id}`);
        }
      }

      this.logger.log(
        `Client connected: ${client.id} (userId: ${userId}, role: ${payload.role})`,
      );
    } catch (error) {
      this.logger.error("Connection failed:", (error as Error).message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ====================================================================
  // Public methods for emitting alerts (called from AlertsService)
  // ====================================================================

  emitAlertToPatient(patientId: string, alert: unknown) {
    this.server?.to(`patient:${patientId}`).emit("alert", alert);
  }

  emitAlertToClinician(clinicianId: string, alert: unknown) {
    this.server?.to(`clinician:${clinicianId}`).emit("alert", alert);
  }

  emitAlertToAll(alert: unknown) {
    this.server?.emit("alert", alert);
  }

  emitRiskAlert(patientId: string, data: unknown) {
    this.server?.to(`patient:${patientId}`).emit("risk_alert", data);
    // Also emit to assigned clinician if available
    this.server?.emit("risk_alert", { ...data as object, patientId });
  }

  emitClinicalReport(patientId: string, report: unknown) {
    this.server?.to(`patient:${patientId}`).emit("clinical_report", report);
    this.server?.emit("clinical_report", { ...report as object, patientId });
  }

  // ====================================================================
  // Handle client subscriptions (optional - for fine-grained listening)
  // ====================================================================

  @SubscribeMessage("subscribe:patient")
  handleSubscribePatient(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { patientId: string },
  ) {
    if (client.data.patientId === data.patientId || client.data.role === "CLINICIAN") {
      client.join(`patient:${data.patientId}`);
      return { event: "subscribed", data: { patientId: data.patientId } };
    }
    return { event: "error", data: { message: "Unauthorized" } };
  }

  @SubscribeMessage("unsubscribe:patient")
  handleUnsubscribePatient(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { patientId: string },
  ) {
    client.leave(`patient:${data.patientId}`);
    return { event: "unsubscribed", data: { patientId: data.patientId } };
  }
}
