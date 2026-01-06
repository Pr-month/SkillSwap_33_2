import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { TJwtPayload } from 'src/auth/types';
import { UserRole } from 'src/users/enums';

@Controller('requests')
@UseGuards(JwtAccessGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Request() req: { user: TJwtPayload },
  ) {
    return this.requestsService.create(createRequestDto, req.user.sub);
  }

  @Get('incoming')
  findIncoming(@Request() req: { user: TJwtPayload }) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @Get('outgoing')
  findOutgoing(@Request() req: { user: TJwtPayload }) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: TJwtPayload }) {
    // Используем checkUserAccess для проверки прав
    return this.requestsService.checkUserAccess(id, req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: { user: TJwtPayload }) {
    return this.requestsService.markAsRead(id, req.user.sub);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Request() req: { user: TJwtPayload }) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Request() req: { user: TJwtPayload }) {
    return this.requestsService.reject(id, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: TJwtPayload }) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.requestsService.remove(id, req.user.sub, isAdmin);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Request() req: { user: TJwtPayload },
  ) {
    return this.requestsService.update(id, updateRequestDto, req.user.sub);
  }
}
