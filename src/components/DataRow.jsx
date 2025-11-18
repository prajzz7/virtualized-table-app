import React from "react";
import { RowHeight } from "../utils/tableUtils";

const DataRow = React.memo(({ item, index }) => {
    return (
        <div 
            className={`grid grid-cols-[1fr_4fr_4fr_3fr] items-center text-sm text-gray-700 transition-colors gap-x-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 border-b border-gray-100`}
            style={{ height: `${RowHeight}px` }}
        >
            <div className="px-4 font-mono text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">{item.id}</div>
            <div className="px-4 font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</div>
            <div className="px-4 text-right font-medium text-indigo-600 overflow-hidden text-ellipsis whitespace-nowrap">${item.numericValue.toLocaleString()}</div>
            <div className="px-4 overflow-hidden text-ellipsis whitespace-nowrap flex justify-start">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'Active' ? 'bg-green-100 text-green-800' :
                    item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                }`}>
                    {item.status}
                </span>
            </div>
        </div>
    );
});

export default DataRow