import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { Time } from 'src/entities/time/time.entity';
import { Repository } from 'typeorm';

import { TimesStatisticsService } from '../times-statistics/times-statistics.service';
import { TimeType } from './TimeType.enum';

@Injectable()
export class TimesService {
  private readonly logger = new Logger(TimesService.name);

  constructor(
    @Inject(forwardRef(() => TimesStatisticsService))
    private readonly statsService: TimesStatisticsService,
    @InjectRepository(Time)
    private readonly timesRepo: Repository<Time>,
  ) {}

  async createOne(userId: number, createTimeDto: CreateTimeDto) {
    const dateDateTime = DateTime.fromISO(createTimeDto.date).toUTC();

    const time = this.timesRepo.create({
      duration: createTimeDto.duration,
      type: createTimeDto.type,
      date: dateDateTime.toJSDate(),
      user: { id: userId },
    });

    const { id: timeId } = await this.timesRepo.save(time);

    void this.statsService.genUserMonthsStats(
      userId,
      dateDateTime.month,
      dateDateTime.year,
    );

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

  async findManyForMonth(userId: number, month: number, year): Promise<Time[]> {
    // Define dates
    const startDate = DateTime.fromObject({ month, year }, { zone: 'UTC' })
      .startOf('month')
      .toJSDate();
    const endDate = DateTime.fromObject({ month, year }, { zone: 'UTC' })
      .startOf('month')
      .plus({ month: 1 })
      .toJSDate();

    const timesQuery = this.timesRepo.createQueryBuilder('time');
    timesQuery.where('time.user_id = :userId', { userId });
    timesQuery.andWhere('time.date >= :startDate', { startDate });
    timesQuery.andWhere('time.date < :endDate', { endDate });

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

    const dateDateTime = DateTime.fromISO(time.date.toString()).toUTC();

    this.logger.debug(
      `Checking for ${dateDateTime.month} ${dateDateTime.year}`,
    );

    await this.timesRepo.remove(time);

    void this.statsService.genUserMonthsStats(
      userId,
      dateDateTime.month,
      dateDateTime.year,
    );
  }
}
