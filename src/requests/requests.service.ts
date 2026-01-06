import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestStatus } from './request-status.enum';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
  ) {}

  // Проверка прав пользователя на заявку
  async checkUserAccess(requestId: string, userId: string): Promise<Request> {
    const request = await this.findOne(requestId);

    const isParticipant =
      request.senderId === userId || request.receiverId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Вы не являетесь участником этой заявки');
    }

    return request;
  }

  // Проверка является ли пользователь админом
  // async isUserAdmin(userId: string): Promise<boolean> {
  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     select: ['id', 'role'],
  //   });
  //   return user?.role === 'admin';
  // }

  // Создать заявку
  async create(
    createRequestDto: CreateRequestDto,
    senderId: string,
  ): Promise<Request> {
    // Проверка: нельзя отправлять заявку самому себе
    if (createRequestDto.receiverId === senderId) {
      throw new BadRequestException('Нельзя отправлять заявку самому себе');
    }

    // Проверка существования получателя
    const receiver = await this.usersRepository.findOne({
      where: { id: createRequestDto.receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Получатель не найден');
    }

    // Проверка существования навыков
    const [offeredSkill, requestedSkill] = await Promise.all([
      this.skillsRepository.findOne({
        where: { id: createRequestDto.offeredSkillId },
        relations: ['owner'],
      }),
      this.skillsRepository.findOne({
        where: { id: createRequestDto.requestedSkillId },
        relations: ['owner'],
      }),
    ]);

    if (!offeredSkill) {
      throw new NotFoundException('Предлагаемый навык не найден');
    }
    if (!requestedSkill) {
      throw new NotFoundException('Запрашиваемый навык не найден');
    }

    // Проверка владения навыками
    if (offeredSkill.owner.id !== senderId) {
      throw new ForbiddenException('Вы не владеете предлагаемым навыком');
    }

    if (requestedSkill.owner.id !== createRequestDto.receiverId) {
      throw new BadRequestException(
        'Получатель не владеет запрашиваемым навыком',
      );
    }

    // Проверка дубликатов активных заявок
    const existingRequest = await this.requestsRepository.findOne({
      where: [
        {
          senderId,
          receiverId: createRequestDto.receiverId,
          status: In([RequestStatus.PENDING, RequestStatus.ACCEPTED]),
        },
        {
          senderId: createRequestDto.receiverId,
          receiverId: senderId,
          status: In([RequestStatus.PENDING, RequestStatus.ACCEPTED]),
        },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('Между вами уже есть активная заявка');
    }

    // Создание заявки
    const request = this.requestsRepository.create({
      ...createRequestDto,
      senderId,
      status: RequestStatus.PENDING,
      isRead: false,
    });

    // Сохранение в БД и возврат результата
    return await this.requestsRepository.save(request);
  }

  // Получить входящие заявки
  async findIncoming(userId: string): Promise<Request[]> {
    const requests = await this.requestsRepository.find({
      where: {
        receiverId: userId,
        status: RequestStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(Request, requests, {
      excludeExtraneousValues: true,
    });
  }

  // Получить исходящие заявки
  async findOutgoing(userId: string): Promise<Request[]> {
    const requests = await this.requestsRepository.find({
      where: {
        senderId: userId,
        status: RequestStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(Request, requests, {
      excludeExtraneousValues: true,
    });
  }

  // Найти заявку по ID
  async findOne(id: string): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    return request;
  }

  // Отметить как прочитанное
  async markAsRead(id: string, userId: string): Promise<Request> {
    const request = await this.findOne(id);

    // Проверяем, что пользователь - получатель
    if (request.receiverId !== userId) {
      throw new ForbiddenException(
        'Только получатель может отмечать заявку как прочитанную',
      );
    }

    request.isRead = true;
    return await this.requestsRepository.save(request);
  }

  // Принять заявку
  async accept(id: string, userId: string): Promise<Request> {
    const request = await this.findOne(id);

    // Проверяем, что пользователь - получатель
    if (request.receiverId !== userId) {
      throw new ForbiddenException('Только получатель может принимать заявку');
    }

    // Проверяем, что заявка в статусе PENDING
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Можно принимать только заявки со статусом "В работе"',
      );
    }

    request.status = RequestStatus.ACCEPTED;
    request.isRead = true;

    return await this.requestsRepository.save(request);
  }

  // Отклонить заявку
  async reject(id: string, userId: string): Promise<Request> {
    const request = await this.findOne(id);

    // Проверяем, что пользователь - получатель
    if (request.receiverId !== userId) {
      throw new ForbiddenException('Только получатель может отклонять заявку');
    }

    // Проверяем, что заявка в статусе PENDING или ACCEPTED
    if (
      ![RequestStatus.PENDING, RequestStatus.ACCEPTED].includes(request.status)
    ) {
      throw new BadRequestException(
        'Нельзя отклонить заявку с текущим статусом',
      );
    }

    request.status = RequestStatus.REJECTED;
    request.isRead = true;

    return await this.requestsRepository.save(request);
  }

  // Удалить заявку
  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const request = await this.findOne(id);

    // Проверяем права: пользователь может удалять только свои заявки, админ - все
    if (!isAdmin && request.senderId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои заявки');
    }

    // Можно удалять только заявки в определенных статусах
    const deletableStatuses = [
      RequestStatus.PENDING,
      RequestStatus.REJECTED,
      RequestStatus.ACCEPTED,
    ];
    if (!deletableStatuses.includes(request.status)) {
      throw new BadRequestException('Нельзя удалить заявку с текущим статусом');
    }

    await this.requestsRepository.remove(request);
  }

  // Обновить заявку (общий метод)
  async update(
    id: string,
    updateRequestDto: UpdateRequestDto,
    userId: string,
  ): Promise<Request> {
    const request = await this.findOne(id);

    // Проверяем права
    const canUpdate =
      request.senderId === userId || request.receiverId === userId;
    if (!canUpdate) {
      throw new ForbiddenException('Нет прав для обновления заявки');
    }

    // Обновляем поля
    if (updateRequestDto.status !== undefined) {
      request.status = updateRequestDto.status;
    }
    if (updateRequestDto.isRead !== undefined) {
      // Только получатель может менять isRead
      if (request.receiverId !== userId) {
        throw new ForbiddenException(
          'Только получатель может менять статус прочтения',
        );
      }
      request.isRead = updateRequestDto.isRead;
    }

    return await this.requestsRepository.save(request);
  }
}
