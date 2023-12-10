import { Provider } from "@nestjs/common";
import { PersonRepositorySymbol } from "#/person/application/dependency-injection/person.di-tokens";
import { MongoDBPersonRepository } from "#/person/infrastructure/repositories/mongodb/mongodb-person.repository";

const PersonRepositoryProvider: Provider = {
  provide: PersonRepositorySymbol,
  useClass: MongoDBPersonRepository,
};

export const personProviders: Provider[] = [PersonRepositoryProvider];
