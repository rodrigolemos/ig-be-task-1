const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const foundUser = users.find(user => user.username === username);
  if (!foundUser) {
    return response.status(404).json({ error: 'User not found.' })
  }
  request.user = foundUser;
  return next();
}

function checkIfTodoExists(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  const todo = user.todos.find(todo => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: 'Todo not found.' })
  }
  request.todo = todo;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };
  if (users.find(user => user.username === newUser.username)) {
    return response.status(400).json({ error: 'User already exists.' })
  }
  users.push(newUser);
  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.json(request.user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const todo = { 
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline),
    created_at: new Date()
  }
  user.todos.push(todo);
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { user, todo } = request;
  const updatedTodo = {
    ...todo,
    title,
    deadline,
  }

  const todoToUpdate = user.todos.findIndex(userTodo => userTodo.id === todo.id);
  user.todos[todoToUpdate] = updatedTodo;

  return response.json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { user, todo } = request;
  const updatedTodo = {
    ...todo,
    done: true,
  }

  const todoToUpdate = user.todos.findIndex(userTodo => userTodo.id === todo.id);
  user.todos[todoToUpdate] = updatedTodo;

  return response.json(updatedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { user, todo } = request;

  const userTodos = user.todos.filter(userTodo => userTodo.id !== todo.id);
  user.todos = userTodos;

  return response.status(204).json([]);
});

module.exports = app;