import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowUp, ArrowDown, Loader, Search } from 'lucide-react';

// --- 1. CONFIGURATION AND UTILITY FUNCTIONS ---

const TOTAL_ROWS = 10000;
const INITIAL_LOAD_COUNT = 500;
const CHUNK_SIZE = 500;
const RowHeight = 60; // Fixed row height for custom virtualization
const LIST_HEIGHT = 700; // Fixed height for the container

const generateData = (count) => {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            id: i,
            name: `Item Name ${i}`,
            numericValue: Math.floor(Math.random() * 100000),
            status: i % 5 === 0 ? 'Active' : (i % 3 === 0 ? 'Pending' : 'Completed'),
        });
    }
    return data;
};

// Simple debounce function hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// --- 2. DATA FETCHING SIMULATION ---

const initialFullData = generateData(TOTAL_ROWS);

const useDataFetching = () => {
    const [data, setData] = useState(initialFullData.slice(0, INITIAL_LOAD_COUNT));
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(TOTAL_ROWS > INITIAL_LOAD_COUNT);
    const loadedCount = useRef(INITIAL_LOAD_COUNT);

    // Simulated fetch function
    const fetchMoreData = useCallback(async () => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const nextData = initialFullData.slice(
            loadedCount.current,
            loadedCount.current + CHUNK_SIZE
        );
        
        if (nextData.length > 0) {
            // Use functional update to ensure we append to the latest state
            setData(prevData => [...prevData, ...nextData]);
            loadedCount.current += nextData.length;
            setHasMore(loadedCount.current < TOTAL_ROWS);
        } else {
            setHasMore(false);
        }
        
        setIsLoading(false);
    }, [isLoading, hasMore]);

    return { data, isLoading, hasMore, fetchMoreData, totalRows: TOTAL_ROWS };
};


// --- 3. SKELETON LOADER COMPONENT ---

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

// --- 4. VIRTUALIZED ROW COMPONENT ---

const DataRow = React.memo(({ item, index }) => {
    return (
        <div 
            className={`flex text-sm text-gray-700 p-4 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 border-b border-gray-100`}
            style={{ height: `${RowHeight}px` }}
        >
            <div className="w-1/12 font-mono text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">{item.id}</div>
            <div className="w-4/12 font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</div>
            <div className="w-4/12 text-right font-medium text-indigo-600 overflow-hidden text-ellipsis whitespace-nowrap">${item.numericValue.toLocaleString()}</div>
            <div className="w-3/12 overflow-hidden text-ellipsis whitespace-nowrap">
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


// --- 5. CUSTOM VIRTUALIZATION LOGIC HOOK ---

const useVirtualizedList = (items, listHeight, rowHeight, overscanCount = 5) => {
    const [scrollOffset, setScrollOffset] = useState(0);

    const onScroll = useCallback((e) => {
        setScrollOffset(e.currentTarget.scrollTop);
    }, []);

    const totalHeight = items.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollOffset / rowHeight) - overscanCount);
    const endIndex = Math.min(
        items.length, 
        Math.ceil((scrollOffset + listHeight) / rowHeight) + overscanCount
    );

    const visibleItems = items.slice(startIndex, endIndex);

    const containerStyle = {
        height: `${LIST_HEIGHT}px`,
        overflowY: 'auto',
        position: 'relative',
    };

    const contentStyle = {
        height: `${totalHeight}px`,
        position: 'relative',
        width: '100%',
    };

    const listStyle = {
        transform: `translateY(${startIndex * rowHeight}px)`,
        width: '100%',
    };

    return {
        visibleItems,
        startIndex,
        onScroll,
        containerStyle,
        contentStyle,
        listStyle,
        totalHeight
    };
};


// --- 6. MAIN APPLICATION COMPONENT ---

const App = () => {
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
        listStyle, 
        totalHeight 
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
    const SortIcon = useCallback(({ column }) => {
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
                    High-Performance Virtualized Table ({filteredAndSortedData.length.toLocaleString()} / {totalRows.toLocaleString()} Rows loaded)
                </h1>
                <p className="text-gray-500">
                    Custom virtualization and infinite scroll for lag-free rendering.
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
                        ID <SortIcon column="id" />
                    </button>
                    
                    {/* Name Column - Sortable */}
                    <button 
                        onClick={() => handleSort('name')}
                        className="w-4/12 p-4 flex items-center justify-start text-left hover:bg-gray-800 transition-colors"
                    >
                        Item Name <SortIcon column="name" />
                    </button>
                    
                    {/* Value Column - Sortable */}
                    <button 
                        onClick={() => handleSort('numericValue')}
                        className="w-4/12 p-4 flex items-center justify-end text-right hover:bg-gray-800 transition-colors"
                    >
                        Numeric Value <SortIcon column="numericValue" />
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
            
            <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 rounded-lg">
                <p className="font-semibold">Optimization and Fix Summary:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                    <li>**Dependency Fix:** Removed the problematic `react-window` dependency.</li>
                    <li>**Custom Virtualization:** Implemented virtualization logic using the `useVirtualizedList` hook, which calculates visible rows based on scroll position (`scrollTop`), ensuring smooth rendering without external libraries.</li>
                    <li>**Performance Hooks:** Maintained the use of `useMemo` for sorting and filtering, `useDebounce` for the search input, and `React.memo` for the row components.</li>
                    <li>**Seamless Skeleton Loading:** Skeletons are now manually appended to the `renderedRows` array when loading, integrating smoothly into the custom virtualization viewport.</li>
                </ul>
            </div>
        </div>
    );
};

export default App;