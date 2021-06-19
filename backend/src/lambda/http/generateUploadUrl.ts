import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

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

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id

  const validTodoId = await todoExists(todoId)

  if (!validTodoId) {
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
  const newItem = await createImage(todoId, imageId, event)

  const url = getUploadUrl(imageId)

  return {
    statusCode: 201,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: newItem,
      uploadUrl: url
    })
  }
}


async function todoExists(todoId: string) {
  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        todoId: todoId
      }
    })
    .promise()

  console.log('Get todo: ', result)
  return !!result.Item
}

async function createImage(todoId: string, imageId: string, event: any) {
  const timestamp = new Date().toISOString()
  const newImage = JSON.parse(event.body)
  const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageId}`

  const newItem = {
    todoId,
    timestamp,
    imageId,
    ...newImage,
    imageUrl
  }
  console.log('Storing new item: ', newItem)

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem
    })
    .promise()

  const updateUrlOnTodo = {
    TableName: todosTable,
    Key: { "todoId": todoId },
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
