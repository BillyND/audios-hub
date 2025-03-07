import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

const EmptyState: React.FC = () => (
  <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
    <ExclamationCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No news data available
    </h3>
    <p className="text-gray-500 mb-6">
      There are no news items to display at this time.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
    >
      Refresh Data
    </button>
  </div>
);

export default EmptyState;
