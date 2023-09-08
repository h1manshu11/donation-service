import mysql, { Connection } from 'mysql2/promise'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
// ES Modules import
const client = new SecretsManagerClient({ region: 'ap-south-1' })
const secretName = 'donation-service-secret'
const command = new GetSecretValueCommand({ SecretId: secretName })

let connection: Connection
try {
  const response = await client.send(command)
  if (!response) throw new Error('Not able to access secret key')
  const decodedBinarySecret = response.SecretString ? JSON.parse(response.SecretString) : undefined
  if (decodedBinarySecret === undefined) throw new Error('DecodeBinarySecret is undefined')
  decodedBinarySecret.multipleStatements = true

  connection = await mysql.createConnection(decodedBinarySecret)
} catch (error: any) {
  console.error(`Failed to connect with db! `, error)
}

export { connection }
