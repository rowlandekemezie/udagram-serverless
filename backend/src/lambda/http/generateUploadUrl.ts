import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('GenerateUploadUrl:')

const docClient = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const todosTable = process.env.TODOS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  logger.info('userId', { userId })
  const isValidTodoId = await todoExists(todoId, userId)


  if (!isValidTodoId) {
    return {
      statusCode: 404,
      headers: {
          'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Todo does not exist'
      })
    }
  }

  const imageId = uuid.v4()
  await createImage(todoId, imageId, event, userId)

  const url = getUploadUrl(imageId)

  return {
    statusCode: 201,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: url
    })
  }
}


async function todoExists(todoId: string, userId: string) {
  logger.info('userId', { userId, todoId })

  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        todoId,
        userId
      }
    })
    .promise()

  logger.info('Get todo: ', result)
  return !!result.Item
}

async function createImage(todoId: string, imageId: string, event: any, userId: string) {
  const timestamp = new Date().toISOString()
  const newImage = JSON.parse(event.body)
  const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageId}`
  logger.info('todoItem', { todoId, imageId, userId, event})
  const key = {
    userId,
    todoId
  }
  const newItem = {
    todoId,
    timestamp,
    imageId,
    ...newImage,
    imageUrl
  }
  logger.info('Storing new item: ', newItem)

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem
    })
    .promise()

  const updateUrlOnTodo = {
    TableName: todosTable,
    Key: key,
    UpdateExpression: "set attachmentUrl = :a",
    ExpressionAttributeValues:{
      ":a": imageUrl
  },
  ReturnValues:"UPDATED_NEW"
  }
  await docClient.update(updateUrlOnTodo).promise()

  return newItem
}

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}
