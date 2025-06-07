import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { isAxiosError } from 'axios';
import { TimeZone } from 'src/entities/time-zone/time-zone.entity';
import { Repository } from 'typeorm';
import { z } from 'zod/v4';

@Injectable()
export class TimeZoneService implements OnModuleInit {
  private readonly logger = new Logger(TimeZoneService.name);

  private loadTimezones = false;

  constructor(
    @InjectRepository(TimeZone)
    private readonly timeZonesRepo: Repository<TimeZone>,
    private readonly configService: ConfigService,
  ) {
    this.loadTimezones = z
      .stringbool()
      .catch(false)
      .parse(this.configService.get<boolean>('LOAD_TIMEZONES', false));
  }

  async onModuleInit() {
    if (this.loadTimezones) {
      try {
        this.logger.debug('Getting available time zones...');

        const timeZoneNames = [...new Set(this.getAllSupportedTimeZones())];

        await this.timeZonesRepo.delete({});

        const dbTimeZones: TimeZone[] = timeZoneNames.map((name) =>
          this.timeZonesRepo.create({ name }),
        );

        await this.timeZonesRepo.save(dbTimeZones);

        this.logger.log('Time zones saved.');
      } catch (error) {
        if (isAxiosError(error)) {
          this.logger.error(
            `Could not fetch time zone names: ${error.message}`,
          );
          return;
        }

        this.logger.error(`Could not fetch time zone names:`);
        console.error(error);
      }
    }
  }

  async findAll(
    options: { orderBy?: 'name' | 'offset'; order?: 'ASC' | 'DESC' } = {},
  ) {
    const queryOrder: [keyof TimeZone, 'ASC' | 'DESC'] = (() => {
      if (options.orderBy === 'name') {
        if (options.order === 'ASC') {
          return ['name', 'ASC'];
        } else if (options.order === 'DESC') {
          return ['name', 'DESC'];
        }
      }
      return ['name', 'ASC'];
    })();

    const timeZones = (
      await this.timeZonesRepo
        .createQueryBuilder('timeZone')
        .orderBy(...queryOrder)
        .getMany()
    ).map((tz) => ({
      ...tz,
      offset: TimeZoneService.getTimeZoneOffset(tz.name),
    }));

    if (options.orderBy === 'offset') {
      if (options.order === 'ASC') {
        timeZones.sort((a, b) => a.offset - b.offset);
      } else if (options.order === 'DESC') {
        timeZones.sort((a, b) => b.offset - a.offset);
      }
    }

    return timeZones;
  }

  /**
   * Gets the offset of the specified time zone from UTC in minutes.
   *
   * Note that this method is not very precise, as it does not account for
   * daylight savings time, for example. It is also not very efficient, as it
   * creates two new Date objects.
   *
   * @param timeZoneName The name of the time zone to get the offset for.
   * @returns The offset from UTC in minutes.
   */
  public static getTimeZoneOffset(timeZoneName: string) {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(
      date.toLocaleString('en-US', { timeZone: timeZoneName }),
    );
    return (tzDate.getTime() - utcDate.getTime()) / 6e4;
  }

  private getAllSupportedTimeZones() {
    // @ts-ignore
    return Intl.supportedValuesOf('timeZone') as string[];
  }
}
