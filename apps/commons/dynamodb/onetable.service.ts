import { OneModel, Table } from 'dynamodb-onetable'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { ulid } from 'ulid'

export class OnetableService extends Table {
  constructor(tableName: string) {
    super({
      client: new DynamoDBClient(),
      name: tableName,
      schema: {
        version: '0.0.1',
        indexes: {
          primary: { hash: 'pk', sort: 'sk' },
          gs1: { hash: 'gs1pk', sort: 'gs1sk' },
        },
        models: {},
        params: {
          typeField: 'typename',
          createdField: 'createdAt',
          updatedField: 'updatedAt',
          isoDates: true,
          timestamps: true,
          nulls: true,
        },
      },
      partial: true,
      generate: () => {
        return ulid()
      },
    })
  }

  createModel(modelName: string, fields: OneModel) {
    this.addModel(modelName, fields)

    return this.getModel(modelName)
  }
}
