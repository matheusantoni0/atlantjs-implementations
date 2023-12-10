import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  MongoDBPersonModel,
  MongoDBPersonModelSchema,
} from "#/person/infrastructure/repositories/mongodb/models/mongodb-person.model";
import { MongoDBPersonRepository } from "#/person/infrastructure/repositories/mongodb/mongodb-person.repository";
import { CoreModule } from "#/core/application/dependency-injection/core.module";
import { personProviders } from "#/person/application/dependency-injection/person.providers";

@Module({
  imports: [
    CoreModule,
    MongooseModule.forFeature([
      { name: MongoDBPersonModel.name, schema: MongoDBPersonModelSchema },
    ]),
  ],
  providers: [...personProviders, MongoDBPersonRepository, MongoDBPersonModel],
})
export class PersonModule {}
