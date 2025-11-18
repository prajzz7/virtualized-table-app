import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { CHUNK_SIZE, LIST_HEIGHT, RowHeight } from '../utils/tableUtils';
import useVirtualizedList from '../hooks/useVirtualizedList';
import useDebounce from '../hooks/useDebounce';
import useDataFetching from '../hooks/useDataFetching';
import DataRow from './DataRow';
import SkeletonRow from './SkeletonRow';

const VirtualizedTable = () => {

    const [filterInput, setFilterInput] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    
    // Data fetching logic
    const { data, isLoading, hasMore, fetchMoreData, totalRows } = useDataFetching();
    const debouncedFilter = useDebounce(filterInput, 300);
    const listRef = useRef(null);

    // Memoized Sorting Function
    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const sortableData = [...data];
        
        sortableData.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'numericValue' || sortBy === 'id') {
                aValue = Number(aValue);
                bValue = Number(bValue);
            }
            
            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableData;
    }, [data, sortBy, sortDirection]);

    // Memoized Filtering Function
    const filteredAndSortedData = useMemo(() => {
        if (!debouncedFilter) {
            return sortedData;
        }

        const lowerCaseFilter = debouncedFilter.toLowerCase();
        
        return sortedData.filter(item => 
            item.id.toString().includes(lowerCaseFilter) ||
            item.name.toLowerCase().includes(lowerCaseFilter) ||
            item.status.toLowerCase().includes(lowerCaseFilter)
        );
    }, [sortedData, debouncedFilter]);

    // Virtualization Logic
    const { 
        visibleItems, 
        startIndex, 
        onScroll, 
        containerStyle, 
        contentStyle, 
        listStyle 
    } = useVirtualizedList(filteredAndSortedData, LIST_HEIGHT, RowHeight);

    // Function to handle infinite scroll trigger
    const checkLoadMore = useCallback((e) => {
        const target = e.currentTarget;
        const scrollBottom = target.scrollTop + target.clientHeight;
        const scrollThreshold = target.scrollHeight - (LIST_HEIGHT * 2); // Start loading 2 container heights early

        if (hasMore && !isLoading && scrollBottom >= scrollThreshold) {
            fetchMoreData();
        }
    }, [hasMore, isLoading, fetchMoreData]);

    const handleScroll = useCallback((e) => {
        onScroll(e);
        checkLoadMore(e);
    }, [onScroll, checkLoadMore]);


    // Function to handle header clicks for sorting
    const handleSort = useCallback((column) => {
        // Reset scroll position when sorting or filtering to prevent visual glitches
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }

        if (sortBy === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    }, [sortBy]);

    // Icon helper for sort indication
    const renderSortIcon = useCallback((column) => {
        if (sortBy !== column) return null;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 ml-2 text-indigo-600" />
            : <ArrowDown className="w-4 h-4 ml-2 text-indigo-600" />;
    }, [sortBy, sortDirection]);
    
    // Total number of items to show in the list, including skeletons for smooth loading.
    const itemCount = hasMore 
        ? filteredAndSortedData.length + CHUNK_SIZE
        : filteredAndSortedData.length;

    // Content to render inside the virtualized space
    const renderedRows = useMemo(() => {
        const rows = visibleItems.map((item, index) => (
            <DataRow 
                key={item.id} 
                item={item} 
                index={startIndex + index} 
            />
        ));
        
        // Append skeleton rows if loading and at the end of the loaded data
        if (isLoading && startIndex + visibleItems.length >= filteredAndSortedData.length) {
            const skeletonCount = Math.min(CHUNK_SIZE, itemCount - filteredAndSortedData.length);
            for (let i = 0; i < skeletonCount; i++) {
                rows.push(
                    <div key={`skeleton-${i}`} style={{ height: `${RowHeight}px` }}>
                        <SkeletonRow />
                    </div>
                );
            }
        }
        
        return rows;
    }, [visibleItems, startIndex, isLoading, filteredAndSortedData.length, itemCount]);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Virtualized Table ({filteredAndSortedData.length.toLocaleString()} / {totalRows.toLocaleString()} Rows loaded)
                </h1>
                <p className="text-gray-500">
                    Efficient row virtualization with seamless infinite scrolling.
                </p>
            </header>

            {/* Controls: Filter Input */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-md flex items-center">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                    type="text"
                    placeholder="Filter by ID, Name, or Status..."
                    value={filterInput}
                    onChange={(e) => setFilterInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                />
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                
                {/* Table Header */}
                <div className="flex bg-gray-900 text-white font-semibold sticky top-0 z-10">
                    
                    {/* ID Column - Sortable */}
                    <button 
                        onClick={() => handleSort('id')}
                        className="w-1/12 p-4 flex items-center justify-start text-left hover:bg-gray-800 transition-colors"
                    >
                        ID {renderSortIcon('id')}
                    </button>
                    
                    {/* Name Column - Sortable */}
                    <button 
                        onClick={() => handleSort('name')}
                        className="w-4/12 p-4 flex items-center justify-start text-left hover:bg-gray-800 transition-colors"
                    >
                        Item Name {renderSortIcon('name')}
                    </button>
                    
                    {/* Value Column - Sortable */}
                    <button 
                        onClick={() => handleSort('numericValue')}
                        className="w-4/12 p-4 flex items-center justify-end text-right hover:bg-gray-800 transition-colors"
                    >
                        Numeric Value {renderSortIcon('numericValue')}
                    </button>

                    {/* Status Column */}
                    <div className="w-3/12 p-4 flex items-center justify-start">
                        Status
                    </div>
                </div>

                {/* Custom Virtualized List Container */}
                <div 
                    ref={listRef}
                    style={containerStyle}
                    onScroll={handleScroll}
                    className="no-scrollbar"
                >
                    <div style={contentStyle}>
                        <div style={listStyle}>
                            {renderedRows}
                        </div>
                    </div>
                </div>
                
                {/* Footer Status Indicator */}
                {!hasMore && data.length > 0 && (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 border-t border-gray-200 font-medium">
                        End of list. All {totalRows.toLocaleString()} items loaded.
                    </div>
                )}
            </div>
        </div>
  )
}

export default VirtualizedTable