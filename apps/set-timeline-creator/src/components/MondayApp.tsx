import React, { useEffect, useState, useCallback } from 'react';
import './MondayApp.css';
import { mondayApi, MondayApi } from '@monday-apps/api';

interface Board {
  id: string;
  name: string;
}

interface Column {
  id: string;
  title: string;
  type: string;
}

// Add a caching mechanism for API responses
const apiCache: {[key: string]: {data: any, timestamp: number}} = {};

// Function to make cached API calls
const cachedApiCall = async (query: string, cacheDuration = 10000) => {
  const cacheKey = query.replace(/\s+/g, '');
  const now = Date.now();
  
  // Check if we have a cached version and it's still fresh
  if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < cacheDuration) {
    console.log('Using cached API response');
    return apiCache[cacheKey].data;
  }
  
  // Make the actual API call
  const response = await monday.api(query);
  
  // Cache the response
  apiCache[cacheKey] = {
    data: response,
    timestamp: now
  };
  
  return response;
};

// Add an interface for item with dates
interface ItemWithDates {
  id: string;
  startDate: string;
  endDate: string;
}

const MondayApp: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [manualBoardId, setManualBoardId] = useState<string>('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [creatingTimeline, setCreatingTimeline] = useState(false);
  
  // Timeline creation states
  const [timelineTitle, setTimelineTitle] = useState<string>('Project Timeline');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [existingTimelineColumn, setExistingTimelineColumn] = useState<string>('');
  const [createNewTimeline, setCreateNewTimeline] = useState(true);
  
  // New states for selecting existing date columns
  const [useExistingDateColumns, setUseExistingDateColumns] = useState(false);
  const [startDateColumn, setStartDateColumn] = useState<string>('');
  const [endDateColumn, setEndDateColumn] = useState<string>('');

  const fetchBoards = useCallback(async () => {
    try {
      console.log('Fetching boards...');
      const query = `query { boards { id name } }`;
      const response = await monday.api(query);
      console.log('Boards response:', response);
      
      if (response.data && response.data.boards) {
        setBoards(response.data.boards);
        console.log('Available boards:', response.data.boards);
        setLoading(false);
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

  const fetchBoardColumns = async (boardId: string) => {
    try {
      console.log('Fetching columns for board:', boardId);
      const query = `
        query {
          boards(ids: ${boardId}) {
            columns {
              id
              title
              type
            }
          }
        }
      `;
      
      const response = await cachedApiCall(query);
      
      if (response.data && response.data.boards && response.data.boards[0]) {
        const allColumns = response.data.boards[0].columns;
        setColumns(allColumns);
        
        // Find timeline columns
        const timelineColumns = allColumns.filter(
          (col: Column) => col.type === 'timeline'
        );
        
        if (timelineColumns.length > 0) {
          setExistingTimelineColumn(timelineColumns[0].id);
          console.log('Found existing timeline columns:', timelineColumns);
        } else {
          console.log('No existing timeline columns found');
        }
        
        // Find date columns for start/end date
        const dateColumns = allColumns.filter(
          (col: Column) => col.type === 'date'
        );
        
        if (dateColumns.length > 0) {
          setStartDateColumn(dateColumns[0].id);
          if (dateColumns.length > 1) {
            setEndDateColumn(dateColumns[1].id);
          } else {
            setEndDateColumn(dateColumns[0].id);
          }
          console.log('Found date columns:', dateColumns);
        }
        
        setError('');
      } else {
        console.error('Invalid board columns response:', response);
        setError('Failed to fetch board columns');
      }
    } catch (error: any) {
      console.error('Error fetching board columns:', error);
      setError('Error fetching board columns: ' + (error.message || 'Unknown error'));
    }
  };

  const fetchBoardItems = async (boardId: string) => {
    try {
      console.log('Fetching items for board:', boardId);
      const query = `
        query {
          boards(ids: ${boardId}) {
            name
            items_page(limit: 50) {
              items {
                id
                name
              }
            }
          }
        }
      `;
      
      console.log('Query:', query);
      const response = await cachedApiCall(query);
      
      if (response.data && response.data.boards && response.data.boards[0]) {
        const boardName = response.data.boards[0].name;
        const items = response.data.boards[0].items_page?.items || [];
        
        if (items.length === 0) {
          setError(`No items found on board "${boardName}" (ID: ${boardId}). Please add some items to the board first or select a different board.`);
        } else {
          console.log(`Found ${items.length} items on board "${boardName}"`);
          setError('');
        }
        
        return items.length > 0;
      } else {
        console.error('Invalid board data response:', response);
        setError(`Board with ID ${boardId} not found or you don't have access to it.`);
        return false;
      }
    } catch (error: any) {
      console.error('Error fetching board items:', error);
      setError('Error fetching board items: ' + (error.message || 'Unknown error'));
      return false;
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

  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const boardId = e.target.value;
    setSelectedBoard(boardId);
    if (boardId) {
      fetchBoardColumns(boardId);
      fetchBoardItems(boardId);
    }
  };

  const handleManualBoardIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBoardId.trim()) {
      console.log('Using manual board ID:', manualBoardId);
      setSelectedBoard(manualBoardId);
      fetchBoardColumns(manualBoardId);
      fetchBoardItems(manualBoardId);
    }
  };

  const fetchColumnValues = async (boardId: string, columnId: string) => {
    try {
      const query = `
        query {
          boards(ids: ${boardId}) {
            items_page(limit: 50) {
              items {
                id
                name
                column_values(ids: ["${columnId}"]) {
                  id
                  text
                  value
                }
              }
            }
          }
        }
      `;
      
      const response = await cachedApiCall(query);
      
      if (response.data && response.data.boards && response.data.boards[0]) {
        return response.data.boards[0].items_page.items;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching column ${columnId} values:`, error);
      return [];
    }
  };

  const createTimelineColumn = async () => {
    if (!selectedBoard) {
      setError('Please select a board first');
      return;
    }

    if (createNewTimeline && !timelineTitle.trim()) {
      setError('Please enter a title for the timeline column');
      return;
    }

    if (!useExistingDateColumns && (!startDate || !endDate)) {
      setError('Please select both start and end dates');
      return;
    }

    if (useExistingDateColumns && (!startDateColumn || !endDateColumn)) {
      setError('Please select both start date and end date columns');
      return;
    }

    // First check if board has items
    const hasItems = await fetchBoardItems(selectedBoard);
    if (!hasItems) {
      setError('Cannot create timeline: No items found on the board. Please add some items to your board first.');
      return;
    }

    try {
      setCreatingTimeline(true);
      setError('');
      setSuccess('');
      
      // Create timeline column if needed
      let timelineColumnId = existingTimelineColumn;
      
      if (createNewTimeline) {
        console.log('Creating new timeline column:', timelineTitle);
        const createColumnMutation = `
          mutation {
            create_column(
              board_id: ${selectedBoard},
              title: "${timelineTitle}",
              column_type: timeline
            ) {
              id
            }
          }
        `;
        
        const createResponse = await monday.api(createColumnMutation);
        
        if (createResponse.data && createResponse.data.create_column) {
          timelineColumnId = createResponse.data.create_column.id;
          console.log('Created new timeline column with ID:', timelineColumnId);
        } else {
          throw new Error('Failed to create timeline column');
        }
      }
      
      // Get items and their date values
      let items = [];
      
      if (useExistingDateColumns) {
        // To improve performance, fetch all items at once with both column values
        const query = `
          query {
            boards(ids: ${selectedBoard}) {
              items_page(limit: 100) {
                items {
                  id
                  name
                  column_values(ids: ["${startDateColumn}", "${endDateColumn}"]) {
                    id
                    text
                    value
                  }
                }
              }
            }
          }
        `;
        
        const response = await monday.api(query);
        
        if (response.data?.boards?.[0]?.items_page?.items) {
          const fetchedItems = response.data.boards[0].items_page.items;
          
          // Process items to extract start and end dates
          items = fetchedItems.map((item: any) => {
            const columnValues = item.column_values || [];
            let startDateValue = '';
            let endDateValue = '';
            
            columnValues.forEach((col: any) => {
              if (col.id === startDateColumn) {
                startDateValue = col.text;
              } else if (col.id === endDateColumn) {
                endDateValue = col.text;
              }
            });
            
            return {
              id: item.id,
              startDate: startDateValue,
              endDate: endDateValue
            };
          });
        }
      } else {
        // Use the manually entered dates for all items
        const query = `
          query {
            boards(ids: ${selectedBoard}) {
              items_page(limit: 100) {
                items {
                  id
                }
              }
            }
          }
        `;
        
        const itemsResponse = await monday.api(query);
        
        if (itemsResponse.data?.boards?.[0]?.items_page?.items) {
          items = itemsResponse.data.boards[0].items_page.items.map((item: any) => ({
            id: item.id,
            startDate,
            endDate
          }));
        }
      }
      
      if (items.length === 0) {
        setError('No items found on the board');
        setCreatingTimeline(false);
        return;
      }
      
      // Prepare batch mutation for all items at once
      const validItems = items.filter((item: ItemWithDates) => {
        if (!item.startDate || !item.endDate) {
          console.log(`Skipping item ${item.id} - missing dates`);
          return false;
        }
        
        // Try to parse and format the dates
        try {
          const startDateObj = new Date(item.startDate);
          const endDateObj = new Date(item.endDate);
          
          // Skip if dates couldn't be parsed (will be invalid dates)
          if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            console.log(`Skipping item ${item.id} - invalid date format`);
            return false;
          }
          
          return true;
        } catch (e) {
          console.log(`Error parsing dates for item ${item.id}:`, e);
          return false;
        }
      });
      
      // Show progress update
      setSuccess(`Processing ${validItems.length} items...`);
      
      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      let successCount = 0;
      
      for (let i = 0; i < validItems.length; i += batchSize) {
        const batch = validItems.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item: ItemWithDates) => {
          try {
            // Format dates for Monday.com API
            const startDateObj = new Date(item.startDate);
            const endDateObj = new Date(item.endDate);
            
            const formattedStartDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
            const formattedEndDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
            
            const timelineValue = JSON.stringify({
              from: formattedStartDate,
              to: formattedEndDate
            });
            
            const updateMutation = `
              mutation {
                change_column_value(
                  board_id: ${selectedBoard},
                  item_id: ${item.id},
                  column_id: "${timelineColumnId}",
                  value: ${JSON.stringify(timelineValue)}
                ) {
                  id
                }
              }
            `;
            
            const updateResponse = await monday.api(updateMutation);
            
            if (updateResponse.data && updateResponse.data.change_column_value) {
              successCount++;
            }
          } catch (e) {
            console.error(`Error updating item ${item.id}:`, e);
          }
        }));
        
        // Update progress
        setSuccess(`Processed ${Math.min(i + batchSize, validItems.length)} of ${validItems.length} items...`);
      }
      
      if (successCount > 0) {
        setSuccess(`Successfully updated timeline for ${successCount} items.`);
        
        // Clear the cache so we get fresh data next time
        Object.keys(apiCache).forEach(key => delete apiCache[key]);
        
        // Refresh columns to show the new timeline
        await fetchBoardColumns(selectedBoard);
      } else {
        setError('No items were updated. Check that your date formats are valid.');
      }
    } catch (error: any) {
      console.error('Error creating timeline:', error);
      setError('Error creating timeline: ' + (error.message || 'Unknown error'));
    } finally {
      setCreatingTimeline(false);
    }
  };

  const createTestItem = async () => {
    if (!selectedBoard) {
      setError('Please select a board first');
      return;
    }

    try {
      setError('');
      setSuccess('Creating test item...');
      
      const mutation = `
        mutation {
          create_item (
            board_id: ${selectedBoard},
            item_name: "Test Item - ${new Date().toLocaleString()}",
            column_values: "{}"
          ) {
            id
          }
        }
      `;
      
      const response = await monday.api(mutation);
      console.log('Create test item response:', response);
      
      if (response.data && response.data.create_item) {
        setSuccess('Test item created successfully! Refreshing board data...');
        
        // Give Monday.com API a moment to update
        setTimeout(async () => {
          // Refresh the board items
          await refreshBoardData();
        }, 1000);
      } else {
        setError('Failed to create test item');
      }
    } catch (error: any) {
      console.error('Error creating test item:', error);
      setError('Error creating test item: ' + (error.message || 'Unknown error'));
    }
  };

  const refreshBoardData = async () => {
    if (!selectedBoard) {
      setError('Please select a board first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const hasItems = await fetchBoardItems(selectedBoard);
      await fetchBoardColumns(selectedBoard);
      
      if (hasItems) {
        setSuccess('Board data refreshed successfully!');
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error refreshing board data:', error);
      setError('Error refreshing board data: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Filter columns that are date type
  const dateColumns = columns.filter(col => col.type === 'date');
  const hasDateColumns = dateColumns.length > 0;

  return (
    <div className="monday-app">
      <h2>S-E-T!</h2>
      <p className="app-subtitle">Simple Efficient Timeline Creator</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
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
      
      {selectedBoard && (
        <div className="timeline-creator">
          <div className="creator-header">
            <h3>Create Timeline</h3>
            <div className="header-buttons">
              <button 
                className="refresh-button" 
                onClick={refreshBoardData}
                title="Refresh board data"
              >
                Refresh Board
              </button>
              <button 
                className="create-test-item-button" 
                onClick={createTestItem}
                title="Create a test item on this board"
              >
                Create Test Item
              </button>
            </div>
          </div>
          
          <div className="timeline-options">
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="timelineOption" 
                  checked={createNewTimeline} 
                  onChange={() => setCreateNewTimeline(true)} 
                />
                Create new timeline column
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="timelineOption" 
                  checked={!createNewTimeline} 
                  onChange={() => setCreateNewTimeline(false)}
                  disabled={columns.filter(col => col.type === 'timeline').length === 0} 
                />
                Use existing timeline column
              </label>
            </div>
            
            {createNewTimeline ? (
              <div className="form-group">
                <label>Timeline Column Title:</label>
                <input 
                  type="text" 
                  value={timelineTitle} 
                  onChange={(e) => setTimelineTitle(e.target.value)}
                  placeholder="Enter timeline column title" 
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Select Timeline Column:</label>
                <select 
                  value={existingTimelineColumn} 
                  onChange={(e) => setExistingTimelineColumn(e.target.value)}
                >
                  {columns
                    .filter(col => col.type === 'timeline')
                    .map(col => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                </select>
              </div>
            )}
            
            <div className="date-source-selector">
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="dateSourceOption" 
                    checked={!useExistingDateColumns} 
                    onChange={() => setUseExistingDateColumns(false)} 
                  />
                  Use same dates for all items
                </label>
                
                <label>
                  <input 
                    type="radio" 
                    name="dateSourceOption" 
                    checked={useExistingDateColumns} 
                    onChange={() => setUseExistingDateColumns(true)}
                    disabled={!hasDateColumns} 
                  />
                  Use dates from existing date columns
                </label>
              </div>
            </div>
            
            {useExistingDateColumns ? (
              <div className="date-column-selectors">
                <div className="form-group">
                  <label>Start Date Column:</label>
                  <select 
                    value={startDateColumn} 
                    onChange={(e) => setStartDateColumn(e.target.value)}
                  >
                    {dateColumns.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>End Date Column:</label>
                  <select 
                    value={endDateColumn} 
                    onChange={(e) => setEndDateColumn(e.target.value)}
                  >
                    {dateColumns.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="date-inputs">
                <div className="form-group">
                  <label>Start Date:</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>End Date:</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                </div>
              </div>
            )}
            
            <button 
              className="create-timeline-button" 
              onClick={createTimelineColumn}
              disabled={
                creatingTimeline || 
                !selectedBoard || 
                (useExistingDateColumns ? (!startDateColumn || !endDateColumn) : (!startDate || !endDate))
              }
            >
              {creatingTimeline ? 'Creating Timeline...' : 'Create Timeline'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MondayApp; 