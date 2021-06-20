import * as AWS  from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class Todo {
  constructor(
    private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')

    const result = await this.docClient.query({
      TableName : this.todosTable,
      IndexName: "UserIdIndex",
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
          ':userId': userId
      },
      ScanIndexForward: false
    }).promise()
  
    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo
  }

  async updateTodo(todoId: string, updatedTodo: TodoUpdate): Promise<TodoUpdate> {
    
   await this.docClient.update({
      TableName: this.todosTable,
      Key: { todoId },  
      UpdateExpression: "SET #n = :n, dueDate = :dueDate, done = :done",
      ExpressionAttributeValues: {
        ":n": updatedTodo.name,
        ":dueDate": updatedTodo.dueDate,
        ":done": updatedTodo.done,
      },
      ExpressionAttributeNames:{
        "#n": "name"
      },
      ReturnValues:"UPDATED_NEW"
    }).promise()
    
    return updatedTodo;
  }

  async deleteTodo(todoId: string): Promise<Record<string, boolean>> {
    
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: { todoId }
    }).promise()

    return {
      message: true
    }
  }
}
