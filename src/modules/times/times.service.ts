import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { CreateTimeDto } from 'src/dto/time/create-time.dto';
import { PutTimeDto } from 'src/dto/time/put-time.dto';
import { Time } from 'src/entities/time/time.entity';
import { DeepPartial, Repository } from 'typeorm';

import { TimeMutationsSubscriber } from './times-mutations-subscriber.interface';
import { TimeType } from './TimeType.enum';

@Injectable()
export class TimesService {
  private readonly logger = new Logger(TimesService.name);

  private readonly asyncMutationsSubscribers: TimeMutationsSubscriber[] = [];
  private readonly syncMutationsSubscribers: TimeMutationsSubscriber[] = [];

  constructor(
    @InjectRepository(Time)
    private readonly timesRepo: Repository<Time>,
  ) {}

  // #region Subscribers

  subscribeAsyncToMutations(subscriber: TimeMutationsSubscriber) {
    if (
      this.asyncMutationsSubscribers.findIndex((s) => s === subscriber) === -1
    ) {
      this.asyncMutationsSubscribers.push(subscriber);
    }
  }

  subscribeSyncToMutations(subscriber: TimeMutationsSubscriber) {
    if (
      this.syncMutationsSubscribers.findIndex((s) => s === subscriber) === -1
    ) {
      this.syncMutationsSubscribers.push(subscriber);
    }
  }

  // #endregion Subscribers

  async createOne(userId: number, createTimeDto: CreateTimeDto) {
    const timePayload: DeepPartial<Time> = {
      duration: createTimeDto.duration,
      type: createTimeDto.type,
      date: DateTime.fromISO(createTimeDto.date).toISODate()!,
      user: { id: userId },
    };

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.beforeTimeInsert(timePayload, userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.beforeTimeInsert(timePayload, userId),
      ),
    );

    const time = this.timesRepo.create(timePayload);

    const { id: timeId } = await this.timesRepo.save(time);

    const dbTime = await this.findOne(timeId, userId);

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.afterTimeInsert(dbTime, userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.afterTimeInsert(dbTime, userId),
      ),
    );

    return dbTime;
  }

  findAllTypes(): string[] {
    return Object.values(TimeType);
  }

  async findAll(
    userId: number,
    {
      order = 'DESC',
      orderby = 'date',
      ...params
    }: {
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

    timesQuery.orderBy(`time.${orderby}`, order);

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

    // Keep previous time data
    const prevTime = { ...time };

    // Set new time data
    const newTime = {
      ...time,
      date: DateTime.fromISO(updateTimeDto.date).toISODate()!,
      duration: updateTimeDto.duration,
      type: updateTimeDto.type,
    };

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.beforeTimeUpdate(prevTime, newTime, userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.beforeTimeUpdate(prevTime, newTime, userId),
      ),
    );

    // time.date = newDateDateTime.toJSDate();
    // time.duration = updateTimeDto.duration;
    // time.type = updateTimeDto.type;

    await this.timesRepo.save(newTime);

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.afterTimeUpdate(prevTime, newTime, userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.afterTimeUpdate(prevTime, newTime, userId),
      ),
    );

    return this.findOne(updateTimeDto.id, userId);
  }

  async deleteAll(userId: number) {
    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.beforeTimesDeleteAll(userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.beforeTimesDeleteAll(userId),
      ),
    );

    await this.timesRepo.delete({ user: { id: userId } });

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.afterTimesDeleteAll(userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.afterTimesDeleteAll(userId),
      ),
    );
  }

  async deleteOne(id: number, userId: number) {
    const time = await this.findOne(id, userId);

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.beforeTimeDelete(time, userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.beforeTimeDelete(time, userId),
      ),
    );

    await this.timesRepo.remove(time);

    // Send to subscribers
    // Async
    for (const sub of this.asyncMutationsSubscribers) {
      void sub.afterTimeDelete(time, userId);
    }
    // Sync
    await Promise.all(
      this.syncMutationsSubscribers.map((sub) =>
        sub.afterTimeDelete(time, userId),
      ),
    );
  }
}
