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
import { TAuthResponse } from 'src/auth/types';
import { UserRole } from 'src/users/enums';

import {
  ApiRequests,
  ApiCreateRequest,
  ApiGetIncomingRequests,
  ApiGetOutgoingRequests,
  ApiGetRequest,
  ApiMarkAsRead,
  ApiAcceptRequest,
  ApiRejectRequest,
  ApiDeleteRequest,
  ApiUpdateRequest,
} from '../swagger';

@Controller('requests')
@UseGuards(JwtAccessGuard)
@ApiRequests()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiCreateRequest()
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Request() req: TAuthResponse,
  ) {
    return this.requestsService.create(createRequestDto, req.user.sub);
  }

  @Get('incoming')
  @ApiGetIncomingRequests()
  findIncoming(@Request() req: TAuthResponse) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @Get('outgoing')
  @ApiGetOutgoingRequests()
  findOutgoing(@Request() req: TAuthResponse) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @Get(':id')
  @ApiGetRequest()
  findOne(@Param('id') id: string, @Request() req: TAuthResponse) {
    // Используем checkUserAccess для проверки прав
    return this.requestsService.checkUserAccess(id, req.user.sub);
  }

  @Patch(':id/read')
  @ApiMarkAsRead()
  markAsRead(@Param('id') id: string, @Request() req: TAuthResponse) {
    return this.requestsService.markAsRead(id, req.user.sub);
  }

  @Patch(':id/accept')
  @ApiAcceptRequest()
  accept(@Param('id') id: string, @Request() req: TAuthResponse) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @Patch(':id/reject')
  @ApiRejectRequest()
  reject(@Param('id') id: string, @Request() req: TAuthResponse) {
    return this.requestsService.reject(id, req.user.sub);
  }

  @Delete(':id')
  @ApiDeleteRequest()
  remove(@Param('id') id: string, @Request() req: TAuthResponse) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.requestsService.remove(id, req.user.sub, isAdmin);
  }

  @Patch(':id')
  @ApiUpdateRequest()
  update(
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Request() req: TAuthResponse,
  ) {
    return this.requestsService.update(id, updateRequestDto, req.user.sub);
  }
}
