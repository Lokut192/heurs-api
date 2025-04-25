import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { Time } from 'src/entities/time/time.entity';
import { Repository } from 'typeorm';

import { TimeType } from './TimeType.enum';

@Injectable()
export class TimesService {
  constructor(
    @InjectRepository(Time)
    private readonly timesRepo: Repository<Time>,
  ) {}

  async createOne(userId: number, createTimeDto: CreateTimeDto) {
    const time = this.timesRepo.create({
      duration: createTimeDto.duration,
      type: createTimeDto.type,
      date: DateTime.fromISO(createTimeDto.date).toUTC().toJSDate(),
      user: { id: userId },
    });

    const { id: timeId } = await this.timesRepo.save(time);

    return this.findOne(timeId, userId);
  }

  findAllTypes(): string[] {
    return Object.values(TimeType);
  }

  async findAll(userId: number): Promise<Time[]> {
    const timesQuery = this.timesRepo.createQueryBuilder('time');

    timesQuery.where('time.user_id = :userId', { userId });

    const times = await timesQuery.getMany();

    return times;
  }

  async findOne(id: number, userId: number) {
    const timeQuery = this.timesRepo.createQueryBuilder('time');
    timeQuery.where('time.id = :id', { id });
    timeQuery.andWhere('time.user_id = :userId', { userId });

    const time = await timeQuery.getOne();

    if (time === null) {
      throw new NotFoundException('Time not found.');
    }

    return time;
  }

  async deleteOne(id: number, userId: number) {
    const time = await this.findOne(id, userId);

    await this.timesRepo.remove(time);
  }
}
