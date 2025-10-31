import { useUser } from "@/app/context/UserContext";
import { useCallback } from "react";

export interface TaskData {
  id: string;
  type: string;
  title: string;
  location: string;
  deadline: Date | string;
  price: number;
  status: string;
  createdAt: string;
  startDate?: Date | string | null;
  time?: string;
  description: string;
  imagePreview?: string;
}

export const useTaskStorage = () => {
  const { userData } = useUser();

  const saveTaskToStorage = useCallback(
    (task: TaskData) => {
      if (!userData?.id) {
        console.error("No user ID available to save task");
        return false;
      }

      const userSpecificKey = `lastPostedTask_${userData.id}`;
      const taskWithUserId = {
        ...task,
        userId: userData.id,
        timestamp: new Date().toISOString(),
      };

      try {
        localStorage.setItem(userSpecificKey, JSON.stringify(taskWithUserId));
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
    const taskData = localStorage.getItem(userSpecificKey);

    if (taskData) {
      try {
        const parsedTask = JSON.parse(taskData);
        if (parsedTask.userId === userData.id) {
          return parsedTask;
        } else {
          localStorage.removeItem(userSpecificKey);
          return null;
        }
      } catch (error) {
        console.error("Error parsing task:", error);
        return null;
      }
    }
    return null;
  }, [userData?.id]);

  const clearLastTask = useCallback(() => {
    if (!userData?.id) return;

    const userSpecificKey = `lastPostedTask_${userData.id}`;
    localStorage.removeItem(userSpecificKey);
  }, [userData?.id]);

  return {
    saveTaskToStorage,
    getLastTask,
    clearLastTask,
  };
};
