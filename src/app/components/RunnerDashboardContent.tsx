'use client'
import React, {useEffect, useState} from 'react'
import { useUser } from '@/app/context/UserContext'
import RecommendedTaskHeader from './RecommendedTaskHeader'
import WalletSummary from './WalletSummary'
import QuickActions from './QuickActions'
import ErrandCard from './ErrandCards'
import { useSharedTaskStorage } from '@/app/hooks/useSharedTaskStorage';
import ErrandDetailsDrawer from './ErrandDetailsDrawer'
import { TokenManager } from '@/app/utils/tokenUtils'
import { toast } from 'react-toastify'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function RunnerDashboardContent(){
  const { userData } = useUser();
  const [tasks, setTasks] = useState<any[]>([]) 
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [typeFilter, setTypeFilter] = useState('')
  const { getAllAvailableTasks } = useSharedTaskStorage()
  const [selectedTask, setSelectedTask] = useState(null);
  

  useEffect(() => {
    console.log("🔐 Token Debug:", {
      hasToken: !!TokenManager.getAccessToken(),
      token: TokenManager.getAccessToken()?.substring(0, 20) + '...',
      isExpired: TokenManager.getAccessToken() ? 
        TokenManager.isTokenExpired(TokenManager.getAccessToken()!) : 'no token',
      storageKeys: Object.keys(localStorage).filter(key => 
        key.includes('token') || key.includes('auth')
      )
    });
  }, []);
  
  // ✅ COMPLETE: Debug effect to analyze storage and tasks
  useEffect(() => {
    console.log("🔍 DEBUG - Storage <Ana1></Ana1>lysis:", {
      allStorageKeys: Object.keys(localStorage),
      availableTaskKeys: Object.keys(localStorage).filter(key => 
        key.startsWith('available_task_') || key.startsWith('lastPostedTask_')
      ),
      tasksFromStorage: getAllAvailableTasks(),
      mockTasks: getAllAvailableTasks().filter(t => t.isMock),
      realTasks: getAllAvailableTasks().filter(t => !t.isMock)
    });

  }, [tasks, getAllAvailableTasks]);
  // ✅ COMPLETE: Task transformation function with proper UUID handling
  const transformTaskData = (backendTask: any) => {
    // Ensure we have a proper ID field
    const taskId = backendTask.id || backendTask.errand_id;
    
    if (!taskId) {
      console.warn("⚠️ Task missing ID:", backendTask);
    }
    
    const transformedTask = {
      id: String(taskId), // This is the backend UUID
      errand_id: String(taskId), // Also include as errand_id for compatibility with ErrandDetailsDrawer
      task_type: backendTask.category?.name || backendTask.task_type || 'General',
      title: backendTask.title,
      description: backendTask.description,
      location: backendTask.location,
      deadline: backendTask.deadline || backendTask.deadline_time,
      price_min: backendTask.price_min || backendTask.price,
      price_max: backendTask.price_max || backendTask.price,
      status: backendTask.status || "pending",
      createdAt: backendTask.created_at || backendTask.createdAt,
      user: backendTask.user || {
        first_name: backendTask.user?.first_name || "Anonymous",
        last_name: backendTask.user?.last_name || "User",
        profile_photo: backendTask.user?.profile_photo || "/default-avatar.png"
      },
      // Include any additional fields from backend
      ...backendTask
    };

    console.log("🔍 Transformed task:", transformedTask);
    return transformedTask;
  };

  useEffect(() => {
    console.log("🔍 DEBUG - Current tasks state:", {
      tasksCount: tasks.length,
      tasks: tasks,
      localStorageKeys: Object.keys(localStorage).filter(key => 
        key.startsWith('available_task_') || key.startsWith('lastPostedTask_')
      ),
      availableTasksFromStorage: getAllAvailableTasks()
    });
  }, [tasks, getAllAvailableTasks]);

  // ✅ COMPLETE: Consolidated fetch function with proper error handling
  const fetchAvailableTasks = async () => {
    try {
      setLoading(true);
      
      const token = await TokenManager.ensureValidToken();
      
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in again');
        // Trigger re-authentication flow
        window.dispatchEvent(new CustomEvent('authRequired'));
        return;
      }

      if (!API_URL) {
        console.error('API_URL is not defined');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (sortBy) params.append('sort', sortBy)
      if (typeFilter) params.append('type', typeFilter)

      console.log('🔍 Fetching tasks from:', `${API_URL}/api/tasks/available?${params.toString()}`)
      
      const response = await fetch(`${API_URL}/api/tasks/available?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      
      let tasksData;
      
      if (response.status === 401) {
        console.error('Authentication failed, clearing tokens');
        TokenManager.clearTokens();
        toast.error('Session expired. Please log in again.');
        window.dispatchEvent(new CustomEvent('authRequired'));
        return;
      }

      if (!response.ok) {
        console.error('Available tasks endpoint failed, trying recommended...');

        // Fallback to recommended endpoint
        const fallbackResponse = await fetch(`${API_URL}/api/tasks/recommended?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
        
        if (fallbackResponse.status === 401) {
          console.error('Recommended endpoint also requires authentication');
          TokenManager.clearTokens();
          toast.error('Please log in again.');
          window.dispatchEvent(new CustomEvent('authRequired'));
          return;
        }

        if (!fallbackResponse.ok) {
          throw new Error(`Both endpoints failed: ${response.status}, ${fallbackResponse.status}`)
        }
        
        tasksData = await fallbackResponse.json()
      } else {
        tasksData = await response.json()
      }
      
      console.log('✅ Raw tasks data from API:', tasksData);
      
      // Process and transform the data
      const processTasksData = (data: any) => {
        let rawTasks: any[] = [];
        
        if (Array.isArray(data)) {
          rawTasks = data;
        } else if (data.results) {
          rawTasks = data.results;
        } else if (data.tasks) {
          rawTasks = data.tasks;
        } else if (data.data) {
          rawTasks = data.data;
        } else {
          console.warn('⚠️ Unknown data structure:', data);
          rawTasks = [];
        }
        
        // ✅ TRANSFORM EACH TASK WITH UUID
        const transformedTasks = rawTasks.map(transformTaskData);
        console.log('✅ Transformed tasks with UUIDs:', transformedTasks);
        const activeTasks = transformedTasks.filter(task => task.status !== 'withdrawn');
        setTasks(activeTasks);
        
        // Only save NON-withdrawn tasks to localStorage
        activeTasks.forEach(task => {
        if (task.id && task.status !== 'withdrawn') {
          const taskKey = `available_task_${task.id}`;
          try {
            localStorage.setItem(taskKey, JSON.stringify(task));
          } catch (error) {
            console.error('Error saving task to storage:', error);
          }
        }
      });
    }
      
      processTasksData(tasksData);

    } catch (error: unknown) { 
      if (error instanceof Error) {
        console.error('Error fetching tasks:', error.message);
      } else {
        console.error('Unknown error fetching tasks:', error);
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };
  // ✅ COMPLETE: Handle opening task drawer via custom event
  useEffect(() => {
    const handler = (e: any) => {
      console.log("🎯 Opening task drawer with task:", e.detail);
      setSelectedTask(e.detail);
    };
    window.addEventListener("openTaskDrawer", handler);
    return () => window.removeEventListener("openTaskDrawer", handler);
  }, []);

  // ✅ COMPLETE: Real-time storage sync
  useEffect(() => {
    const loadTasks = () => {
      try {
        // Get tasks from localStorage (both API and tasker-posted)
        const availableTasks = getAllAvailableTasks();
        console.log('🏃‍♂️ Runner loaded tasks from storage:', availableTasks);
        
        // Filter out withdrawn tasks
        const activeTasks = availableTasks.filter((task: any) => 
          task?.status !== 'withdrawn'
        );
        // Combine with existing API tasks, avoiding duplicates
        setTasks(prevTasks => {
          const existingIds = new Set(prevTasks.map(t => t.id));
          const newTasks = availableTasks.filter((task: any) => 
            task?.id && !existingIds.has(task.id)
          );
          
          if (newTasks.length > 0) {
            console.log('🔄 Adding new tasks from storage:', newTasks);
            return [...prevTasks, ...newTasks];
          }
          
          return prevTasks;
        });
      } catch (error) {
        console.error('Error loading tasks from storage:', error);
      }
    };

    // Load initial tasks from storage
    loadTasks();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('available_task_')) {
        console.log('🔄 Storage event detected:', event.key);

        // If the task was removed (withdrawn), reload all tasks
        if (event.newValue === null) {
          console.log('🗑️ Task was removed, reloading all tasks');
          loadTasks();
        } else {
        // Check if the updated task is withdrawn
          try {
            const updatedTask = JSON.parse(event.newValue || '{}');
            if (updatedTask.status === 'withdrawn') {
              console.log('🗑️ Task marked as withdrawn, reloading all tasks');
              loadTasks();
            } else {
              loadTasks();
            }
          } catch (e) {
            loadTasks();
          }
        }
      }
    };

    // Listen for custom events (same tab)
    const handleTaskUpdated = () => {
      console.log('🔄 Custom task update event received');
      loadTasks();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('taskUpdated', handleTaskUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskUpdated', handleTaskUpdated);
    };
  }, [getAllAvailableTasks]);

  // ✅ COMPLETE: Auto-refresh tasks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing tasks...');
      const storageTasks = getAllAvailableTasks();

      const activeStorageTasks = storageTasks.filter((task: any) => 
        task?.status !== 'withdrawn'
      );

      setTasks(prev => {
        // Merge storage tasks with existing tasks
        const existingIds = new Set(prev.map(t => t.id));
        const newTasks = storageTasks.filter((task: any) => 
          task?.id && !existingIds.has(task.id)
        );
        return newTasks.length > 0 ? [...prev, ...newTasks] : prev;
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [getAllAvailableTasks]);

  // ✅ COMPLETE: Load tasks from localStorage on initial load
  useEffect(() => {
    if (!userData) return;
    
    const loadLocalTasks = async () => {
      try {
        // Clean up old mock tasks
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("mock_task_")) {
            localStorage.removeItem(key);
          }
        });

        // Load real tasks only
        const availableTasks = getAllAvailableTasks().filter(
          (t: any) => t && t.id && !t.isMock && t.status !== 'withdrawn'
        );

        console.log('Loaded local tasks:', availableTasks);
        setTasks(availableTasks);
      } catch (error) {
        console.error("Error loading local tasks:", error);
      }
    };   

    loadLocalTasks();
  }, [userData, getAllAvailableTasks]);

  // ✅ COMPLETE: Cleanup withdrawn tasks from storage
    const cleanupWithdrawnTasks = () => {
      try {
        const allTaskKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('available_task_')
        );
        
        let removedCount = 0;
        allTaskKeys.forEach(key => {
          try {
            const task = JSON.parse(localStorage.getItem(key) || '{}');
            if (task.status === 'withdrawn') {
              localStorage.removeItem(key);
              removedCount++;
            }
          } catch (e) {
            console.error('Error parsing task during cleanup:', e);
          }
        });
        
        if (removedCount > 0) {
          console.log(`🧹 Cleaned up ${removedCount} withdrawn tasks`);
        }
      } catch (error) {
        console.error('Error during task cleanup:', error);
      }
    };

  useEffect(() => {
    if (!userData) return;
    cleanupWithdrawnTasks();
  }, [userData]);

  useEffect(() => {
    // Clean up mock tasks from localStorage
    const cleanupMockTasks = () => {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('available_task_')) {
          try {
            const task = JSON.parse(localStorage.getItem(key) || '{}');
            const id =
            typeof task.id === "string"
              ? task.id
              : typeof task.errand_id === "string"
                ? task.errand_id
                : "";

            if (task.isMock || !id || id.startsWith("mock_")) {
              localStorage.removeItem(key);
              console.log("🧹 Removed invalid or mock task:", key);
            }
          } catch (error) {
            console.error('Error cleaning up task:', error);
          }
        }
      });
    };

    cleanupMockTasks();
  }, []);

  // ✅ COMPLETE: Main API fetch effect
  useEffect(() => {
    if (!userData || userData === null) {
      console.log('Waiting for user data...');
      return;
    }
    
    console.log("🚀 Fetching tasks from API...");
    fetchAvailableTasks();
  }, [userData, search, sortBy, typeFilter]);

  // ✅ COMPLETE: Debug effect to monitor tasks
  useEffect(() => {
    if (tasks.length > 0) {
      console.log("🎯 Currently rendering tasks:", tasks.map(t => ({
        id: t.id,
        title: t.title,
        hasErrandId: !!t.errand_id,
        user: t.user?.first_name,
        source: t.isMock ? 'mock' : 'real'
      })));
    }
  }, [tasks]);

  const handleSearch = (val: string) => {
    console.log("🔍 Search:", val);
    setSearch(val);
  }
  
  const handleSort = (val: string) => {
    console.log("📊 Sort:", val);
    setSortBy(val);
  }
  
  const handleTypeFilter = (val: string) => {
    console.log("🏷️ Filter:", val);
    setTypeFilter(val);
  }

  // ✅ COMPLETE: Handle drawer close
  const handleDrawerClose = () => {
    console.log("🗑️ Closing task drawer");
    setSelectedTask(null);
  }

  // ✅ COMPLETE: Handle manual refresh
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchAvailableTasks();

    const storageTasks = getAllAvailableTasks();
    setTasks(storageTasks);
  
  }
    
   const getDisplayId = (taskId: any) => {
    if (!taskId) return 'No ID';
    
    // Convert to string and handle different ID formats
    const idString = String(taskId);
    
    // For UUIDs or long strings, show first 8 characters
    if (idString.length > 8) {
      return `${idString.substring(0, 8)}...`;
    }
    
    // For short IDs, show the full ID
    return idString;
  }

   const displayTasks = tasks.filter((task, index, self) => {

    if (!task?.id || !task?.title) return false;
  
    if (task.isMock) return false;
  // Find the first occurrence of this task ID
  const firstIndex = self.findIndex(t => t.id === task.id);
  
  // Only keep the first occurrence (remove duplicates)
  if (index !== firstIndex) {
    console.warn(`⚠️ Removing duplicate task: ${task.id} - ${task.title}`);
    return false;
  }
  
  return true;
});


  return (
    <div className="w-full h-full flex flex-col min-h-0">

      {/* TOP ROW — Header + WalletSummary */}
      <div className="shrink-0 px-4 md:px-8 lg:px-12 pt-4 pb-0 sticky top-[72px] z-20">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Header (grows more space) */}
          <div className="flex-1 mb-0">
            <RecommendedTaskHeader
              onSearch={handleSearch}
              onSort={handleSort}
              onType={handleTypeFilter}
             
            />
          </div>

          {/* Wallet summary on the right */}
          <div className="w-full lg:w-[30%]">
            <WalletSummary />
          </div>
        </div>
      </div>

      {/* MAIN SECTION — ErrandCards left, QuickActions right */}
      <div className="flex flex-row px-4 md:px-8 lg:px-12 pb-6 min-h-0 overflow-hidden">

        {/* Scrollable errand cards */}
        <div className="flex-1 overflow-y-auto pr-2 mt-4 pb-10 min-h-[400px]"> 
          {selectedTask && (
            <ErrandDetailsDrawer
              task={selectedTask}
              onClose={handleDrawerClose}
            />
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-1">
              {displayTasks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  {search ? 'No tasks found matching your search.' : 'No recommended tasks available right now.'}
                  <button 
                    onClick={handleRefresh}
                    className="mt-4 px-4 py-2 ml-3 bg-[#424BE0] text-white rounded-lg hover:bg-[#353CCB] transition"
                  >
                    Refresh Tasks
                  </button>
                </div>
              ) : (
                displayTasks.map((task) => (
                  <div key={task.id} className="relative">
                    {/* Debug overlay - remove in production */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10 opacity-70">
                      ID: {getDisplayId(task.id)}...
                    </div>
                    <ErrandCard task={task} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* QuickActions — sticky right */}
        <aside className="hidden lg:block w-[30%] shrink-0">
          <div className="sticky top-4">
            <QuickActions />
          </div>
        </aside>
      </div>

    </div>
  );
}