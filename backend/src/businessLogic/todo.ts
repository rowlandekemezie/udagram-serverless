

import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { Todo } from '../dataLayer/todo'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todo = new Todo()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return todo.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

  const todoId = uuid.v4()

  return await todo.createTodo({
    todoId,
    userId,
    done: false,
    createdAt: new Date().toISOString(),
    ...createTodoRequest
  })
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  todoId: string
): Promise<TodoUpdate> {

  return await todo.updateTodo(
    todoId,
    updateTodoRequest
  )
}

export async function deleteTodo(
  todoId: string
): Promise<Record<string, boolean>> {
  return await todo.deleteTodo(todoId)
}
