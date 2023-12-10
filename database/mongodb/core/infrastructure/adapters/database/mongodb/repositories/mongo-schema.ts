import { Prop } from "@nestjs/mongoose";

export abstract class MongoSchema {
  @Prop({ isRequired: true, unique: true })
  public readonly id!: string;
}
