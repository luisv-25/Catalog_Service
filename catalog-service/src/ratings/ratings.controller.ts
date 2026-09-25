import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { RatingsService } from "./ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";
import { JwtRolesGuard } from "../common/jwt-roles.guard";
import { Roles } from "../common/roles.decorator";

// Anidado bajo /tutors/:tutorId/ratings — el estudiante califica al tutor
// tras (o independientemente de) una tutoría, según lo pedido para la demo.
@Controller("tutors/:tutorId/ratings")
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // Permiso de estudiante: dejar el rating al profesor. El studentId sale
  // del propio token, no del body, para que nadie califique en nombre de
  // otro estudiante.
  @Post()
  @UseGuards(JwtRolesGuard)
  @Roles("student")
  rate(@Param("tutorId") tutorId: string, @Body() dto: CreateRatingDto, @Req() req: any) {
    return this.ratingsService.rateTutor(tutorId, req.user.id, dto);
  }

  @Get()
  list(@Param("tutorId") tutorId: string) {
    return this.ratingsService.listForTutor(tutorId);
  }
}
