import { Time } from 'src/entities/time/time.entity';
import { DeepPartial } from 'typeorm';

export interface TimeMutationsSubscriber {
  // Insertion
  beforeTimeInsert(
    time: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown>;
  afterTimeInsert(
    time: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown>;

  // Update
  beforeTimeUpdate(
    prevTime: DeepPartial<Time>,
    newTime: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown>;
  afterTimeUpdate(
    prevTime: DeepPartial<Time>,
    newTime: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown>;

  // Deletion
  beforeTimesDeleteAll(userId: number): unknown | Promise<unknown>;
  afterTimesDeleteAll(userId: number): unknown | Promise<unknown>;
  beforeTimeDelete(
    time: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown>;
  afterTimeDelete(
    time: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown>;
}
