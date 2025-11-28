import { useUser } from "@/app/context/UserContext";
import { useCallback } from "react";
import { TaskData } from "@/app/types/task";

export const useTaskStorage = () => {
  const { userData } = useUser();

  const saveTaskToStorage = useCallback(
    (task: TaskData) => {
      if (!userData?.id) {
        console.error("No user ID available to save task");
        return false; 
      }

      if (!task.id) {
        console.error("Cannot save task without ID (backend UUID)");
        return false;
      }

      const userSpecificKey = `lastPostedTask_${userData.id}`;
      const taskWithMetadata = {
        ...task,
        userId: userData.id,
        timestamp: new Date().toISOString(),
      };

      try {
        localStorage.setItem(userSpecificKey, JSON.stringify(taskWithMetadata));
        console.log("✅ Task saved for user:", userData.id);
        return true;
      } catch (error) {
        console.error("Error saving task:", error);
        return false;
      }
    },
    [userData?.id]
  );

  const getLastTask = useCallback(() => {
    if (!userData?.id) return null;

    const userSpecificKey = `lastPostedTask_${userData.id}`;
    
      try {
        const taskData = localStorage.getItem(userSpecificKey);
        if (!taskData) return null;

        const parsedTask = JSON.parse(taskData) as TaskData & { userId: string; timestamp: string };
        
        // ✅ Validate user ownership and task structure
        if (parsedTask.userId !== userData.id) {
          console.warn("Task user ID mismatch, clearing corrupted data");
          localStorage.removeItem(userSpecificKey);
          return null;
        }

        // ✅ Ensure the task has required fields
        if (!parsedTask.id) {
          console.warn("Retrieved task missing ID, clearing corrupted data");
          localStorage.removeItem(userSpecificKey);
          return null;
        }

        console.log("📥 Retrieved task with UUID:", parsedTask.id);
        return parsedTask;
      } catch (error) {
        console.error("Error parsing task from storage:", error);
        // Clear corrupted data
        localStorage.removeItem(userSpecificKey);
        return null;
      }
    }, [userData?.id]);

  const clearLastTask = useCallback(() => {
    if (!userData?.id) return;

    const userSpecificKey = `lastPostedTask_${userData.id}`;
    localStorage.removeItem(userSpecificKey);
    console.log("🗑️ Cleared task for user:", userData.id);
  }, [userData?.id]);

  // ✅ New method to get task by ID (useful for fetching applications)
  const getTaskById = useCallback((taskId: string) => {
    if (!userData?.id) return null;

    const userSpecificKey = `lastPostedTask_${userData.id}`;
    
    try {
      const taskData = localStorage.getItem(userSpecificKey);
      if (!taskData) return null;

      const parsedTask = JSON.parse(taskData) as TaskData & { userId: string; timestamp: string };
      
      // Return task only if it matches the requested ID and belongs to current user
      if (parsedTask.id === taskId && parsedTask.userId === userData.id) {
        return parsedTask;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting task by ID:", error);
      return null;
    }
  }, [userData?.id]);
  return {
    saveTaskToStorage,
    getLastTask,
    clearLastTask,
    getTaskById
  };
};
