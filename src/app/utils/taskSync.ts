// utils/taskSync.ts
export const syncTaskToRunners = (taskData: any) => {
  try {
    const sharedTask = {
      id: taskData.id,
      errand_id: taskData.id, // For compatibility
      title: taskData.title,
      description: taskData.description,
      location: taskData.location,
      deadline: taskData.deadline,
      price_min: taskData.price_min || taskData.price,
      price_max: taskData.price_max || taskData.price,
      task_type: taskData.task_type || taskData.type || "General",
      status: taskData.status || "active",
      created_at: taskData.created_at || new Date().toISOString(),
      user: taskData.user || {
        first_name: "Anonymous",
        last_name: "User", 
        profile_photo: "/default-avatar.png"
      },
      category: taskData.category || { name: taskData.task_type || "General" },
      isMock: false,
      last_updated: new Date().toISOString()
    };
    
    const taskKey = `available_task_${taskData.id}`;
    localStorage.setItem(taskKey, JSON.stringify(sharedTask));
    
    console.log('✅ Task synced to runners:', {
      key: taskKey,
      task: sharedTask,
      allAvailableTasks: Object.keys(localStorage).filter(k => k.startsWith('available_task_'))
    })

    window.dispatchEvent(new StorageEvent('storage', {
      key: taskKey,
      newValue: JSON.stringify(sharedTask),
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href
    }));
    
    console.log('✅ Task synced to runners:', taskKey);
    return true;
  } catch (error) {
    console.error('❌ Error syncing task to runners:', error);
    return false;
  }
};

//Function to remove/update task status
export const updateTaskStatus = (taskId: string, status: 'withdrawn' | 'completed' | 'active') => {
  try {
    const taskKey = `available_task_${taskId}`;
    const existingTask = localStorage.getItem(taskKey);
    
    if (existingTask) {
      const taskData = JSON.parse(existingTask);
      taskData.status = status;
      taskData.last_updated = new Date().toISOString();
      
      if (status === 'withdrawn') {
        // Remove withdrawn tasks
        localStorage.removeItem(taskKey);
        console.log('🗑️ Task removed from runner dashboard:', taskId);
      } else {
        // Update status for other cases
        localStorage.setItem(taskKey, JSON.stringify(taskData));
        console.log('🔄 Task status updated:', taskId, status);
      }
      
      // Trigger storage event for real-time updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: taskKey,
        newValue: status === 'withdrawn' ? null : JSON.stringify(taskData),
        oldValue: existingTask,
        storageArea: localStorage,
        url: window.location.href
      }));
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error updating task status:', error);
    return false;
  }
}