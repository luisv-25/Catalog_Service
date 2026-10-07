import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

interface UserPublicProfile {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly baseUrl =
    process.env.USER_SERVICE_URL || "http://localhost:3001";

  constructor(private readonly http: HttpService) {}

  // Comunicación SÍNCRONA (REST): Catalog llama a User Service para
  // completar datos de perfil que no mantiene en caché (doc, sección 4.2).
  async getUserProfile(userId: string): Promise<UserPublicProfile> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<UserPublicProfile>(
          `${this.baseUrl}/api/v1/users/${userId}`,
          { timeout: 3000 }, // timeout corto: sección 6.5 del documento
        ),
      );
      return data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 404) {
        throw new NotFoundException(`Usuario ${userId} no existe en User Service`);
      }
      this.logger.error(
        `Fallo al consultar User Service para ${userId}: ${axiosErr.message}`,
      );
      throw err;
    }
  }
}
