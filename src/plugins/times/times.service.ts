import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { PutTimeDto } from 'src/dto/time/put-time.dto';
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

    void this.statsService.genUserMonthStats(
      userId,
      dateDateTime.month,
      dateDateTime.year,
    );

    void this.statsService.genUserWeekStats(
      userId,
      dateDateTime.weekNumber,
      dateDateTime.weekYear,
    );

    return this.findOne(timeId, userId);
  }

  findAllTypes(): string[] {
    return Object.values(TimeType);
  }

  async findAll(
    userId: number,
    params: {
      from?: string | undefined;
      to?: string | undefined;
      orderby: keyof Time;
      order: 'DESC' | 'ASC';
    } = { orderby: 'date', order: 'DESC' },
  ): Promise<Time[]> {
    const timesQuery = this.timesRepo.createQueryBuilder('time');

    timesQuery.where('time.user_id = :userId', { userId });

    if (params.from) {
      timesQuery.andWhere('time.date >= :from', { from: params.from });
    }
    if (params.to) {
      timesQuery.andWhere('time.date < :to', { to: params.to });
    }

    timesQuery.orderBy(`time.${params.orderby}`, params.order);

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

  async findManyForWeek(userId: number, week: number, year): Promise<Time[]> {
    // Define dates
    const startDate = DateTime.fromObject(
      { weekNumber: week, weekYear: year },
      { zone: 'UTC' },
    )
      .startOf('week')
      .toJSDate();
    const endDate = DateTime.fromObject(
      { weekNumber: week, weekYear: year },
      { zone: 'UTC' },
    )
      .startOf('week')
      .plus({ week: 1 })
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

  async updateOne(userId: number, updateTimeDto: PutTimeDto) {
    let time: Time | null = null;

    try {
      time = await this.findOne(updateTimeDto.id, userId);
    } catch (_timeNotFoundException) {
      // Do nothing here
    }

    if (time === null) {
      throw new BadRequestException('Time does not exist.');
    }

    const prevDateDateTime = DateTime.fromISO(time.date.toString()).toUTC();
    const newDateDateTime = DateTime.fromISO(
      updateTimeDto.date.toString(),
    ).toUTC();

    time.date = newDateDateTime.toJSDate();
    time.duration = updateTimeDto.duration;
    time.type = updateTimeDto.type;

    await this.timesRepo.save(time);

    // Update prev stats
    void this.statsService.genUserMonthStats(
      userId,
      prevDateDateTime.month,
      prevDateDateTime.year,
    );
    void this.statsService.genUserWeekStats(
      userId,
      prevDateDateTime.weekNumber,
      prevDateDateTime.weekYear,
    );

    // Update new stats only if needed
    if (
      prevDateDateTime.month !== newDateDateTime.month ||
      newDateDateTime.year !== prevDateDateTime.year
    ) {
      void this.statsService.genUserMonthStats(
        userId,
        newDateDateTime.month,
        newDateDateTime.year,
      );
    }
    if (
      prevDateDateTime.weekNumber !== newDateDateTime.weekNumber ||
      newDateDateTime.year !== prevDateDateTime.weekYear
    ) {
      void this.statsService.genUserWeekStats(
        userId,
        newDateDateTime.weekNumber,
        newDateDateTime.weekYear,
      );
    }

    return this.findOne(updateTimeDto.id, userId);
  }

  async deleteAll(userId: number) {
    await this.timesRepo.delete({ user: { id: userId } });

    void this.statsService.deleteAllMonthsStats(userId);

    void this.statsService.deleteAllWeeksStats(userId);
  }

  async deleteOne(id: number, userId: number) {
    const time = await this.findOne(id, userId);

    const dateDateTime = DateTime.fromISO(time.date.toString()).toUTC();

    await this.timesRepo.remove(time);

    void this.statsService.genUserMonthStats(
      userId,
      dateDateTime.month,
      dateDateTime.year,
    );

    void this.statsService.genUserWeekStats(
      userId,
      dateDateTime.weekNumber,
      dateDateTime.weekYear,
    );
  }
}
