import { Logger } from "@atlantjs.dev/logger";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import _ from "lodash";
import { Model } from "mongoose";
import { None, Option } from "oxide.ts";

import { LoggerSymbol } from "#/core/application/dependency-injection/core.di-tokens";
import { Datetime } from "#/core/domain/value-objects/datetime";
import { Document } from "#/core/domain/value-objects/document";
import { MongoRepository } from "#/core/infrastructure/adapters/database/mongodb/repositories/mongo-repository.base";
import { LoggerDecorator } from "#/core/infrastructure/adapters/logger/logger-factory";
import { RealStateMapperSymbol } from "#/real-state/application/dependency-injection/real-state.di-tokens";
import { RealState } from "#/real-state/domain/entities/real-state";
import { RealStateId } from "#/real-state/domain/entities/real-state-id";
import { RealStateModel } from "#/real-state/domain/repositories/real-state.model";
import { RealStateRepository } from "#/real-state/domain/repositories/real-state.repository";
import { MongoDBRealStateModel } from "#/real-state/infrastructure/repositories/mongodb/models/mongodb-real-state.model";
import { Mapper } from "#/libs/ddd/mapper";

@Injectable()
export class MongoDBRealStateRepository
  extends MongoRepository<RealState, MongoDBRealStateModel>
  implements RealStateRepository
{
  public constructor(
    @Inject(RealStateMapperSymbol)
    protected readonly mapper: Mapper<RealState, MongoDBRealStateModel>,
    @Inject(LoggerSymbol)
    protected readonly logger: Logger,
    @InjectModel(MongoDBRealStateModel.name)
    private readonly realStateModel: Model<MongoDBRealStateModel>
  ) {
    super(mapper, logger, realStateModel);
  }

  @LoggerDecorator()
  public async findByDocument(document: Document): Promise<Option<RealState>> {
    const model = await this.realStateModel.findOne({
      document: document.toString(),
    });

    if (!model) {
      return None;
    }

    return Option(this.mapper.toDomain(model));
  }

  @LoggerDecorator()
  public async listByRealStateId(
    realStateId: RealStateId
  ): Promise<RealState[]> {
    const model = await this.realStateModel.find({
      realStateId: realStateId.toString(),
    });
    return model.map((model) => this.mapper.toDomain(model));
  }

  @LoggerDecorator()
  public async updateOne(entity: RealState): Promise<void> {
    entity.validate();
    const modelToSave = this.mapper.toPersistance(entity);
    await this.updateRealStateModel(modelToSave);
  }

  @LoggerDecorator()
  private async updateRealStateModel(
    realStateModel: RealStateModel
  ): Promise<void> {
    const model = _.omit(realStateModel, "createdAt", "id");

    await this.realStateModel.updateOne(
      { id: realStateModel.id },
      { ...model, updatedAt: Datetime.create().unpack().value }
    );
  }
}
