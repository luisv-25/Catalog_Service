import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SubjectsService } from "./subjects.service";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { JwtRolesGuard } from "../common/jwt-roles.guard";
import { Roles } from "../common/roles.decorator";

@Controller("subjects")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  // Permiso de admin: registrar una materia nueva en el catálogo.
  @Post()
  @UseGuards(JwtRolesGuard)
  @Roles("admin")
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  // Permiso de admin: eliminar una materia del catálogo.
  @Delete(":id")
  @UseGuards(JwtRolesGuard)
  @Roles("admin")
  remove(@Param("id") id: string) {
    return this.subjectsService.remove(id);
  }
}
