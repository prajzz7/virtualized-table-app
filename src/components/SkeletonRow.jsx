// --- 3. SKELETON LOADER COMPONENT ---

import React from "react";
import { RowHeight } from "../utils/tableUtils";

const SkeletonRow = React.memo(() => (
    <div 
        className="flex items-center space-x-4 p-4 border-b border-gray-100 bg-white animate-pulse"
        style={{ height: `${RowHeight}px` }}
    >
        <div className="h-4 bg-gray-200 rounded w-1/12"></div>
        <div className="h-4 bg-gray-200 rounded w-4/12"></div>
        <div className="h-4 bg-gray-200 rounded w-4/12"></div>
        <div className="h-4 bg-gray-200 rounded w-3/12"></div>
    </div>
));

export default SkeletonRow