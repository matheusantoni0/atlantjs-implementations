import _ from "lodash";
import { Logger } from "@atlantjs.dev/logger";
import { None, Option } from "oxide.ts";
import mongoose, { Model } from "mongoose";

import { MongoSchema } from "#/core/infrastructure/adapters/database/mongodb/repositories/mongo-schema";
import { LoggerDecorator } from "#/core/infrastructure/adapters/logger/logger-factory";
import { Datetime } from "#/core/domain/value-objects/datetime";
import { Entity } from "#/libs/ddd/entity";
import { EntityId } from "#/libs/ddd/entity-id";
import { Mapper } from "#/libs/ddd/mapper";
import { Repository } from "#/libs/ddd/repository";

export abstract class MongoRepository<
  Aggregate extends Entity<unknown>,
  DbModel extends MongoSchema
> extends Repository<Aggregate> {
  protected constructor(
    protected readonly mapper: Mapper<Aggregate, DbModel>,
    protected readonly logger: Logger,
    private readonly schema: Model<DbModel>
  ) {
    super(logger);
  }

  @LoggerDecorator()
  public async upsert(aggregate: Aggregate): Promise<void> {
    aggregate.validate();
    const optionEntity = await this.findOneById(aggregate.id);
    const model = this.mapper.toPersistance(aggregate);

    await this.upsertQuery(optionEntity, model);
  }

  @LoggerDecorator()
  public async findOneById(aggregateId: EntityId): Promise<Option<Aggregate>> {
    const schema = Option(
      await this.schema.findOne({ id: aggregateId.toString() })
    );

    if (schema.isNone()) {
      return None;
    }

    const entity = this.mapper.toDomain(schema.unwrap());

    return Option(entity);
  }

  @LoggerDecorator()
  public async findAll(): Promise<Aggregate[]> {
    const schemas = await this.schema.find();

    return schemas.map((schema) => this.mapper.toDomain(schema));
  }

  @LoggerDecorator()
  // eslint-disable-next-line max-statements
  public async transaction<T>(handler: () => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      this.logger.debug("Transaction started");
      const result = await handler();
      await session.commitTransaction();
      this.logger.debug("Transaction committed");
      return result;
    } catch (error: unknown) {
      await session.abortTransaction();
      this.logger.debug("Transaction aborted", { error });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  @LoggerDecorator()
  public async save(entity: Aggregate): Promise<void> {
    const model = this.mapper.toPersistance(entity);
    await this.persistModel(model);
  }

  @LoggerDecorator()
  public async del(aggregate: Aggregate): Promise<void> {
    await this.schema.deleteOne({ id: aggregate.id.toString() });
  }

  @LoggerDecorator()
  private async upsertQuery(
    optionEntity: Option<Aggregate>,
    modelToPersist: DbModel
  ): Promise<void> {
    if (optionEntity.isSome()) {
      return this.updateModel(modelToPersist);
    }

    await this.persistModel(modelToPersist);
  }

  @LoggerDecorator()
  private async persistModel(model: DbModel): Promise<void> {
    await this.schema.create(model);
  }

  @LoggerDecorator()
  private async updateModel(model: DbModel): Promise<void> {
    const modelToPersist = _.omit(model, "createdAt", "id");
    await this.schema.updateOne(
      { id: model.id },
      { ...modelToPersist, updatedAt: Datetime.create().unpack().value }
    );
  }
}
