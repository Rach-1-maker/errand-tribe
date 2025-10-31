// components/TaskSummaryCard.tsx
import Image from "next/image";
import { MdLocationOn } from "react-icons/md";
import { GoClock } from "react-icons/go";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { TiShoppingCart } from "react-icons/ti";
import { CareTaskData, LocalMicroTaskData, PickupDeliveryTaskData, SupermarketTaskData, TaskData, VerifyItTaskData } from "../types/task";

interface TaskSummaryCardProps {
  task: TaskData;
}

export default function TaskSummaryCard({ task }: TaskSummaryCardProps) {
  const renderTaskSpecificDetails = () => {
    switch (task.type) {
      case "Local Errand":
        return <LocalMicroSummary task={task} />;
      case "Supermarket Runs":
        return <SupermarketSummary task={task} />;
      case "Pickup & Delivery":
        return <PickupDeliverySummary task={task} />;
      case "Care Task":
        return <CareTaskSummary task={task} />;
      case "Verify It":
        return <VerifyItSummary task={task} />;
      default:
        return <DefaultSummary task={task} />;
    }
  };

  return (
    <div className="flex-1 bg-white w-[85%] rounded-2xl shadow-md p-6 lg:p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="font-medium  border border-[#424BE0]/20 text-sm px-3 py-1 mb-2 bg-[#424BE0]/25 rounded-full text-[#424BE0]">
          {task.type}
        </p>

        {/* ✅ Show image preview here */}
        {task.imagePreview && (
          <div className="w-12 h-12 rounded-lg overflow-hidden">
            <Image
              src={task.imagePreview}
              alt="Task preview"
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>

      <h3 className="text-gray-800 font-semibold text-md mb-1">{task.title}</h3>


      
      {/* Common details for all task types */}
      <div className="space-y-2 mb-2">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <MdLocationOn className="text-gray-400 text-3xl" />
          <span>{task.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <GoClock className="text-gray-400 text-sm" />
          <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <AiOutlineDollarCircle className="text-gray-400 text-sm" />
          <span className="font-semibold">Price: ₦{task.price.toLocaleString()}</span>
        </div>
      </div>

      {/* Task-specific details */}
      {renderTaskSpecificDetails()}
    </div>
  );
}

// Local Micro Task Summary
function LocalMicroSummary({ task }: { task: LocalMicroTaskData }) {
  return (
    <div className="space-y-2">
      <p className="text-sm mb-1">{task.description}</p>
      {task.startDate && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <GoClock className="text-gray-400 text-sm" />
          <span>Start: {new Date(task.startDate).toLocaleDateString()} {task.time && `at ${task.time}`}</span>
        </div>
      )}
      
    
    </div>
  );
}

// Supermarket Runs Summary
function SupermarketSummary({ task }: { task: SupermarketTaskData }) {
  return (
    <div className="space-y-3">
      {task.shoppingList && task.shoppingList.length > 0 && (
        <div className="mt-2 flex">
          <span className="flex ">
          <TiShoppingCart className="text-gray-400 text-md mr-2"/>
          <p className="text-sm text-gray-500 ">Shopping List ({task.shoppingList.length} items):</p>
          </span>
          <p className="text-xs mt-1 ml-1 text-gray-600 line-clamp-2">
            {task.shoppingList.slice(0, 3).join(", ")}
            {task.shoppingList.length > 3 && "..."}
          </p>
        </div>
      )}
      {task.dropoff && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <MdLocationOn className="text-gray-400 text-sm " />
          <span>Drop Off: {task.dropoff}</span>
        </div>
      )}  
    </div>
  );
}

// Pickup & Delivery Summary
function PickupDeliverySummary({ task }: { task: PickupDeliveryTaskData }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 text-sm">
        <div>
          <p className="text-gray-600 mb-1 text-xs">Pickup:</p>
          <p className="font-medium text-sm truncate">{task.pickup}</p>
        </div>
        <div>
          <p className="text-gray-600 mb-1 text-xs">Dropoff:</p>
          <p className="font-medium text-sm truncate">{task.dropoff}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-start">
          <span className="text-gray-600 mr-8">Urgent:</span>
          <span className={`font-medium ${task.urgent ? 'text-red-500' : 'text-gray-600'}`}>
            {task.urgent ? "Yes" : "No"}
          </span>
        </div>
        
        <div className="flex justify-start">
          <span className="text-gray-600 mr-8">Signature:</span>
          <span className="font-medium">{task.signatureRequired || "No"}</span>
        </div>
      </div>
      
      <div className="flex justify-start text-sm">
        <span className="text-gray-600 mr-8">Fragile:</span>
        <span className="font-medium">{task.fragile || "No"}</span>
      </div>
      
      {task.note && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Special Note:</p>
          <p className="text-sm text-gray-600 line-clamp-2">{task.note}</p>
        </div>
      )}
    </div>
  );
}

// Care Task Summary
function CareTaskSummary({ task }: { task: CareTaskData }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-start gap-x-4 text-sm">
        <span className="text-gray-600">Care Type:</span>
        <span className="font-medium">{task.careType}</span>
      </div>
      
      <div className="flex justify-start gap-x-4 text-sm">
        <span className="text-gray-600">For:</span>
        <span className="font-medium capitalize">{task.whoFor}</span>
      </div>
      
      <div className="flex justify-start gap-x-4 text-sm">
        <span className="text-gray-600">Frequency:</span>
        <span className="font-medium capitalize">{task.frequency.replace('-', ' ')}</span>
      </div>
      
      {task.frequency === "weekly" && task.weeklyDays.length > 0 && (
        <div className="flex justify-start gap-x-4 text-sm">
          <span className="text-gray-600">Days:</span>
          <span className="font-medium">
            {task.weeklyDays.map(day => 
              day.substring(0, 1).toUpperCase() + day.substring(1, 3)
            ).join(", ")}
          </span>
        </div>
      )}
      
      {task.sensitivities && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Sensitivities:</p>
          <p className="text-sm text-gray-600 line-clamp-2">{task.sensitivities}</p>
        </div>
      )}
      
      {task.arrivalRequest && (
        <div className="mt-2 flex">
          <p className="text-xs text-gray-500 mb-1 mr-4">Arrival Instructions:</p>
          <p className="text-xs text-gray-600 line-clamp-2">{task.arrivalRequest}</p>
        </div>
      )}
      
      {task.afterCompletion.length > 0 && (
        <div className="flex">
          <p className="text-xs mr-4 text-gray-500 mb-1">After Completion:</p>
          <div className="flex flex-wrap gap-1">
            {task.afterCompletion.map((action, index) => (
              <span key={index} className="bg-[#EFF0FD] text-[#424BE0] text-xs px-1 py-1 rounded">
                {action.replace('provide ', '').replace('scan ', '')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Verify It Summary
function VerifyItSummary({ task }: { task: VerifyItTaskData }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-start text-sm">
        <span className="text-gray-600 mr-6">Verification Type:</span>
        <span className="font-medium capitalize">
          {task.verificationType === "others" ? task.verificationTypeOther : task.verificationType}
        </span>
      </div>
      
      <p className="text-gray-500 text-sm line-clamp-2">{task.taskDescription}</p>
      
      <div className="flex justify-start text-sm">
        <span className="text-gray-600 mr-6">Contact Required:</span>
        <span className="font-medium">{task.shouldSpeak === "yes" ? "Yes" : "No"}</span>
      </div>
      
      {task.contactName && (
        <div className="flex justify-start text-sm">
          <span className="text-gray-600 mr-6">Contact Person:</span>
          <span className="font-medium">{task.contactName}</span>
        </div>
      )}
      
      {task.afterCompletion.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">After Completion:</p>
          <div className="flex flex-wrap gap-1">
            {task.afterCompletion.map((action, index) => (
              <span key={index} className="bg-[#EFF0FD] text-[#424BE0] text-xs px-2 py-1 rounded">
                {action.replace('provide ', '').replace('scan ', '')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DefaultSummary({ task }: { task: TaskData }) {
  return (
    <div className="space-y-3">
      {task.startDate && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <GoClock className="text-gray-400 text-sm" />
          <span>Start: {new Date(task.startDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}