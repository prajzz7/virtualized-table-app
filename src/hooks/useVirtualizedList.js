import { useCallback, useState } from "react";
import { LIST_HEIGHT } from "../utils/tableUtils";

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

export default useVirtualizedList