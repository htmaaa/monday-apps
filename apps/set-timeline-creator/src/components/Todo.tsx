import React, { useEffect, useState, useCallback } from 'react';
import mondaySdk from 'monday-sdk-js';
import './Todo.css';

// Initialize the Monday SDK
const monday = mondaySdk();

interface TodoItem {
  id: string;
  name: string;
  completed: boolean;
}

interface Board {
  id: string;
  name: string;
}

const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoName, setNewTodoName] = useState('');
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [manualBoardId, setManualBoardId] = useState<string>('');

  const fetchBoards = useCallback(async () => {
    try {
      console.log('Fetching boards...');
      const query = `query { boards { id name } }`;
      const response = await monday.api(query);
      console.log('Boards response:', response);
      
      if (response.data && response.data.boards) {
        setBoards(response.data.boards);
        console.log('Available boards:', response.data.boards);
        
        // Find the p6 board
        const p6Board = response.data.boards.find((board: Board) => 
          board.name.toLowerCase() === 'p6' || 
          board.name.toLowerCase() === 'p-6' ||
          board.name.toUpperCase() === 'P6'
        );
        
        if (p6Board) {
          console.log('Found P6 board:', p6Board);
          setSelectedBoard(p6Board.id);
          fetchBoardItems(p6Board.id);
        } else {
          console.log('P6 board not found');
          setError('Board "p6" not found. Please select a board from the dropdown.');
          setLoading(false);
        }
      } else {
        console.error('Invalid boards response:', response);
        setError('Failed to fetch boards');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching boards:', error);
      setError('Error fetching boards: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  }, []);

  const fetchBoardItems = async (boardId: string) => {
    try {
      console.log('Fetching items for board:', boardId);
      const query = `
        query {
          boards(ids: ${boardId}) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      `;
      
      console.log('Query:', query);
      const response = await monday.api(query);
      console.log('Board items response:', response);
      
      if (response.data && response.data.boards && response.data.boards[0]) {
        const items = response.data.boards[0].items.map((item: any) => {
          const statusColumn = item.column_values.find((col: any) => 
            col.id === 'status' || col.id.includes('status')
          );
          
          const completed = statusColumn ? 
            statusColumn.text.toLowerCase().includes('done') || 
            statusColumn.text.toLowerCase().includes('complete') : 
            false;
          
          return {
            id: item.id,
            name: item.name,
            completed
          };
        });
        
        console.log('Processed items:', items);
        setTodos(items);
        setLoading(false);
      } else {
        console.error('Invalid board items response:', response);
        setError('Failed to fetch board items');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching board items:', error);
      let errorMessage = 'Error fetching board items: ';
      
      if (error.status === 401 || error.status === 403) {
        errorMessage += 'Authentication failed. Please check your API token.';
      } else if (error.status === 404) {
        errorMessage += 'Board not found. Please check the board ID.';
      } else if (error.response) {
        errorMessage += JSON.stringify(error.response.data || error.message);
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize the Monday SDK with token
    const token = process.env.REACT_APP_MONDAY_API_TOKEN;
    console.log('Token available:', !!token);
    monday.setToken(token || '');
    
    // Fetch boards
    fetchBoards();
  }, [fetchBoards]);

  const addTodo = async () => {
    if (!newTodoName.trim() || !selectedBoard) return;
    
    try {
      const mutation = `
        mutation {
          create_item (
            board_id: ${selectedBoard},
            item_name: "${newTodoName}",
            column_values: "{}"
          ) {
            id
          }
        }
      `;
      
      const response = await monday.api(mutation);
      
      if (response.data && response.data.create_item) {
        const newTodo: TodoItem = {
          id: response.data.create_item.id,
          name: newTodoName,
          completed: false
        };
        
        setTodos([...todos, newTodo]);
        setNewTodoName('');
      } else {
        setError('Failed to create new item');
      }
    } catch (error: any) {
      console.error('Error creating item:', error);
      setError('Error creating item: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      // Find the current status of the item
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      
      // Toggle the status
      const newStatus = !todo.completed;
      
      // Find the status column ID
      const query = `
        query {
          boards(ids: ${selectedBoard}) {
            columns {
              id
              title
              type
            }
          }
        }
      `;
      
      const response = await monday.api(query);
      
      if (response.data && response.data.boards && response.data.boards[0]) {
        const statusColumn = response.data.boards[0].columns.find((col: any) => 
          col.title.toLowerCase().includes('status') && 
          (col.type === 'status' || col.type === 'dropdown')
        );
        
        if (statusColumn) {
          // Update the status
          const mutation = `
            mutation {
              change_column_value(
                board_id: ${selectedBoard},
                item_id: ${id},
                column_id: "${statusColumn.id}",
                value: "${newStatus ? 'Done' : 'Not Started'}"
              ) {
                id
              }
            }
          `;
          
          await monday.api(mutation);
          
          // Update local state
          setTodos(
            todos.map(todo => 
              todo.id === id ? { ...todo, completed: newStatus } : todo
            )
          );
        } else {
          setError('Status column not found');
        }
      } else {
        setError('Failed to fetch board columns');
      }
    } catch (error: any) {
      console.error('Error updating item:', error);
      setError('Error updating item: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const boardId = e.target.value;
    setSelectedBoard(boardId);
    fetchBoardItems(boardId);
  };

  const addNewColumn = async () => {
    if (!selectedBoard) {
      setError('Please select a board first');
      return;
    }

    setAddingColumn(true);
    setError('');

    try {
      const mutation = `
        mutation {
          create_column(
            board_id: ${selectedBoard},
            title: "Nothing",
            column_type: text
          ) {
            id
          }
        }
      `;
      
      const response = await monday.api(mutation);
      
      if (response.data && response.data.create_column) {
        // Refresh the board items to show the new column
        fetchBoardItems(selectedBoard);
        setError('Column "Nothing" added successfully!');
      } else {
        setError('Failed to add column');
      }
    } catch (error: any) {
      console.error('Error adding column:', error);
      setError('Error adding column: ' + (error.message || 'Unknown error'));
    } finally {
      setAddingColumn(false);
    }
  };

  const handleManualBoardIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBoardId.trim()) {
      console.log('Using manual board ID:', manualBoardId);
      setSelectedBoard(manualBoardId);
      fetchBoardItems(manualBoardId);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="todo-app">
      <h2>Monday.com Todo App</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="board-selector">
        <label htmlFor="board-select">Select Board: </label>
        <select 
          id="board-select" 
          value={selectedBoard} 
          onChange={handleBoardChange}
        >
          <option value="">Select a board</option>
          {boards.map(board => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="manual-board-input">
        <form onSubmit={handleManualBoardIdSubmit}>
          <input
            type="text"
            placeholder="Or enter board ID manually"
            value={manualBoardId}
            onChange={(e) => setManualBoardId(e.target.value)}
          />
          <button type="submit">Use This ID</button>
        </form>
      </div>
      
      <div className="board-actions">
        <button 
          className="add-column-button" 
          onClick={addNewColumn}
          disabled={addingColumn || !selectedBoard}
        >
          {addingColumn ? 'Adding Column...' : 'Add "Nothing" Column'}
        </button>
      </div>
      
      <div className="add-todo">
        <input
          type="text"
          value={newTodoName}
          onChange={(e) => setNewTodoName(e.target.value)}
          placeholder="Add new todo"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      
      <ul className="todo-list">
        {todos.map(todo => (
          <li 
            key={todo.id} 
            className={todo.completed ? 'completed' : ''}
          >
            <input 
              type="checkbox" 
              checked={todo.completed} 
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todo; 