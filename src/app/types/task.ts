// types/task.ts
export interface BaseTaskData {
  id: string;
  task_type: string;
  title: string;
  location: string;
  description: string;
  deadline: Date | string;
  price: number;
  price_min: number;
  price_max: number;
  status: "posted" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
  startDate?: Date | string | null;
  time?: string;
  userId?: string; // ✅ Add userId for user-specific storage
  timestamp?: string; // ✅ Add timestamp for when the task was saved
}

export interface LocalMicroTaskData extends BaseTaskData {
  task_type: "Local Errand";
  title: string;
  description: string;
  location: string;
  deadline: Date | string;
  price: number;
  price_min: number;
  price_max: number;
  imagePreview?: string;
}

export interface SupermarketTaskData extends BaseTaskData {
  task_type: "Supermarket Runs";
  title: string;
  description: string;
  shoppingList?: string[];
  location: string;
  deadline: Date | string;
  dropoff: string;
  price: number;
  price_min: number;
  price_max: number;
  imagePreview?: string;
}

export interface PickupDeliveryTaskData extends BaseTaskData {
  task_type: "Pickup & Delivery";
  title: string;
  details: string,
  deadline: Date | string;
  pickup: string;
  senderPhone: string;
  dropoff: string;
  recipientPhone: string;
  signatureRequired: "Yes" | "No" | "";
  fragile: "Yes" | "No" | "";
  note: string;
  imagePreview?: string;
  price: number;
  price_min: number;
  price_max: number;
  urgent: boolean;
}

export interface CareTaskData extends BaseTaskData {
  task_type: "Care Task";
  title: string;
  deadline: Date | string;
  location: string;
  careType: string;
  whoFor: "me" | "family" | "friend" | "others" | "";
  sensitivities: string;
  details: string;
  arrivalRequest: string;
  afterCompletion: string[];
  imagePreview?: string;
  frequency: "one-time" | "daily" | "weekly" | "";
  weeklyDays: string[];
  preferredRunner: string;
  price: number;
  price_min: number;
  price_max: number;
}

export interface VerifyItTaskData extends BaseTaskData {
  task_type: "Verify It";
  title: string;
  deadline: Date | string;
  verificationType: string;
  verificationTypeOther: string;
  location: string;
  taskDescription: string;
  afterCompletion: string[];
  afterCompletionOther: string;
  shouldSpeak: "yes" | "no" | "";
  contactName: string;
  contactPhone: string;
  price: number;
  price_min: number;
  price_max: number;
  imagePreview?: string;
}

export type TaskData = 
  | LocalMicroTaskData 
  | SupermarketTaskData 
  | PickupDeliveryTaskData 
  | CareTaskData 
  | VerifyItTaskData;