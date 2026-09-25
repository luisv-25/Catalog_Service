import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { TutorsService } from "./tutors.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AddSubjectDto } from "./dto/add-subject.dto";
import { JwtRolesGuard } from "../common/jwt-roles.guard";

@Controller("tutors")
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  search(
    @Query("subjectId") subjectId?: string,
    @Query("level") level?: string,
    @Query("userId") userId?: string,
  ) {
    return this.tutorsService.search(subjectId, level, userId);
  }

  // Este endpoint dispara la llamada síncrona a User Service por debajo.
  @Get(":id/profile")
  getProfile(@Param("id") id: string) {
    return this.tutorsService.getProfile(id);
  }

  // El propio tutor edita su bio/tarifa; un admin también puede hacerlo.
  @Patch(":id/profile")
  @UseGuards(JwtRolesGuard)
  updateProfile(@Param("id") id: string, @Body() dto: UpdateProfileDto, @Req() req: any) {
    return this.tutorsService.updateProfile(id, dto, req.user);
  }

  // El propio tutor asocia una materia a su perfil ("control de la materia
  // a la que fue asignado"); un admin puede asignarla en nombre de otro
  // tutor (permiso de admin: reasignar un maestro a otra materia).
  @Post(":id/subjects")
  @UseGuards(JwtRolesGuard)
  addSubject(@Param("id") id: string, @Body() dto: AddSubjectDto, @Req() req: any) {
    return this.tutorsService.addSubject(id, dto.subjectId, req.user, dto.yearsExperience);
  }

  // Segundo paso de "reasignar": quitar al tutor de una materia antes (o
  // después) de asociarlo a otra vía POST :id/subjects.
  @Delete(":id/subjects/:subjectId")
  @UseGuards(JwtRolesGuard)
  removeSubject(@Param("id") id: string, @Param("subjectId") subjectId: string, @Req() req: any) {
    return this.tutorsService.removeSubject(id, subjectId, req.user);
  }
}
