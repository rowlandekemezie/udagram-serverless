import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'


import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('TodoClass')
export class Todo {
  constructor(
    private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos', { userId })

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

  async updateTodo(todoId: string, userId: string, updatedTodo: TodoUpdate): Promise<TodoUpdate> {
    logger.info('todoItem', todoId)
    
    const key = { 
      userId,
      todoId
    }
   await this.docClient.update({
      TableName: this.todosTable,
      Key: key,  
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

  async deleteTodo(todoId: string, userId: string): Promise<Record<string, boolean>> {
  
    const key = {
      userId,
      todoId
    }
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: key
    }).promise()

    return {
      message: true
    }
  }
}
