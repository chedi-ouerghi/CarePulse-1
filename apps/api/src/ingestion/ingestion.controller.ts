import {
  Controller,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IngestionService } from "./ingestion.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("ingestion")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("upload/:patientId")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @Param("patientId") patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("fileType") fileType: "glucose" | "events" = "glucose"
  ) {
    if (!file) throw new BadRequestException("No file uploaded");

    const isCSV = file.originalname.endsWith(".csv");
    const isJSON =
      file.originalname.endsWith(".json") ||
      file.mimetype === "application/json";

    if (!isCSV && !isJSON) {
      throw new BadRequestException("Only CSV and JSON files are supported");
    }

    if (isCSV) {
      return this.ingestionService.ingestCSV(
        patientId,
        file.buffer,
        fileType
      );
    } else {
      return this.ingestionService.ingestJSON(
        patientId,
        file.buffer,
        fileType
      );
    }
  }

  @Post("sample/:patientId")
  async loadSampleData(@Param("patientId") patientId: string) {
    return this.ingestionService.getPatientDataSummary(patientId);
  }
}
