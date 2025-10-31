// types/task.ts
export interface BaseTaskData {
  id: string;
  type: string;
  title: string;
  location: string;
  description: string;
  deadline: Date | string;
  price: number;
  status: "posted" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
  startDate?: Date | string | null;
  time?: string;
}

export interface LocalMicroTaskData extends BaseTaskData {
  type: "Local Errand";
  title: string;
  description: string;
  location: string;
  deadline: Date | string;
  price: number;
  imagePreview?: string;
}

export interface SupermarketTaskData extends BaseTaskData {
  type: "Supermarket Runs";
  title: string;
  description: string;
  shoppingList?: string[];
  location: string;
  deadline: Date | string;
  dropoff: string;
  price: number;
  imagePreview?: string;
}

export interface PickupDeliveryTaskData extends BaseTaskData {
  type: "Pickup & Delivery";
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
  urgent: boolean;
}

export interface CareTaskData extends BaseTaskData {
  type: "Care Task";
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
}

export interface VerifyItTaskData extends BaseTaskData {
  type: "Verify It";
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
  imagePreview?: string;
}

export type TaskData = 
  | LocalMicroTaskData 
  | SupermarketTaskData 
  | PickupDeliveryTaskData 
  | CareTaskData 
  | VerifyItTaskData;