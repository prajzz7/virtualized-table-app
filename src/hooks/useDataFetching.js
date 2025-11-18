import { useCallback, useRef, useState } from "react";
import { CHUNK_SIZE, INITIAL_LOAD_COUNT, TOTAL_ROWS } from "../utils/tableUtils";


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

export default useDataFetching