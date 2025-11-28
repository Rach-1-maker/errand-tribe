import { useCallback } from "react";

export const useSharedTaskStorage = () => {

  const transformTaskForRunner = useCallback((taskData: any) => {
    // If already in runner format, return as-is
    if (taskData.price_min !== undefined && taskData.task_type && taskData.user) {
      return taskData;
    }

    const isMock = !taskData.id || taskData.id.startsWith('mock_');
    // Transform tasker format to runner format
    return {
      id: taskData.id,
      errand_id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      location: taskData.location,
      deadline: taskData.deadline,
      price_min: taskData.price_min || taskData.price,
      price_max: taskData.price_max || taskData.price,
      task_type: taskData.task_type || taskData.type || "General",
      status: taskData.status || "pending",
      created_at: taskData.created_at || taskData.createdAt || new Date().toISOString(),
      user: taskData.user || {
        first_name: "Anonymous",
        last_name: "User",
        profile_photo: "/default-avatar.png"
      },
      category: taskData.category || { name: taskData.task_type || taskData.type || "General" },
      isMock: isMock, // 🚨 Important: Mark mock tasks
      last_updated: new Date().toISOString()
    };
  }, []);

  const getAllAvailableTasks = useCallback(() => {
    try {
      const tasks = Object.keys(localStorage)
        .filter(key => key.startsWith('available_task_'))
        .map(key => {
          try {
            return JSON.parse(localStorage.getItem(key) || '{}');
          } catch (e) {
            console.error('Error parsing task:', e);
            return null;
          }
        })
        .filter(task => 
          task && 
          task.id && 
          task.status !== 'withdrawn' && // 🚨 FILTER OUT WITHDRAWN TASKS
          task.status !== 'completed' && 
          task.status !== 'accepted'
        );

      return tasks;
    } catch (error) {
      console.error('Error getting available tasks:', error);
      return [];
    }
  }, []);


  const saveTaskForRunners = useCallback((taskData: any) => {
    const transformed = transformTaskForRunner(taskData);
    if (!transformed || !transformed.id) {
      console.error("❌ Cannot save task: invalid transformation or missing ID");
      return false;
    }

    try {
      localStorage.setItem(`available_task_${transformed.id}`, JSON.stringify(transformed));

      window.dispatchEvent(new StorageEvent('storage', {
        key: `available_task_${transformed.id}`,
        newValue: JSON.stringify(transformed),
        oldValue: null,
        storageArea: localStorage,
        url: window.location.href
      }));
      
      // Also dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('taskUpdated'));
      
      console.log("✅ Task saved for runners:", transformed.id);
      return true;
    } catch (error) {
      console.error("Error saving task for runners:", error);
      return false;
    }
  }, [transformTaskForRunner]);

  return { 
    getAllAvailableTasks, 
    saveTaskForRunners,
    transformTaskForRunner 
  };
};

