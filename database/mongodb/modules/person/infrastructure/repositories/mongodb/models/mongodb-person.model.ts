import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { MongoSchema } from "#/core/infrastructure/adapters/database/mongodb/repositories/mongo-schema";
import { RealStateModel } from "#/real-state/domain/repositories/real-state.model";

@Schema({ collection: "real-state" })
export class MongoDBRealStateModel
  extends MongoSchema
  implements RealStateModel
{
  @Prop({ required: true, unique: true })
  public readonly id!: string;

  @Prop({ required: true })
  public readonly name!: string;

  @Prop()
  public readonly createdAt!: Date;

  @Prop()
  public readonly updatedAt!: Date;
}

export const MongoDBRealStateModelSchema = SchemaFactory.createForClass(
  MongoDBRealStateModel
);
