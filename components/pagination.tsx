import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from './ui/icon';
import { Text } from './ui/text';
import { View } from './ui/view';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Get a range of pages to display
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [
        1,
        '...',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <View className="flex-row items-center justify-center my-4 bg-transparent">
      {/* Previous Button */}
      <TouchableOpacity
        className="p-2 mx-1 rounded-md disabled:opacity-50"
        disabled={currentPage === 1}
        onPress={() => onPageChange(currentPage - 1)}
      >
        <Icon name={ChevronLeft} className="text-foreground" />
      </TouchableOpacity>

      {/* Page Numbers */}
      {visiblePages.map((page, index) =>
        page === '...' ? (
          <Text key={index} className="mx-2 text-foreground">
            ...
          </Text>
        ) : (
          <TouchableOpacity
            key={index}
            className={`w-10 h-10 items-center justify-center mx-1 rounded-md ${
              page === currentPage
                ? 'bg-primary'
                : 'bg-card'
            }`}
            onPress={() => onPageChange(page as number)}
            disabled={page === currentPage}
          >
            <Text
              className={`font-bold ${
                page === currentPage
                  ? 'text-primary-foreground'
                  : 'text-card-foreground'
              }`}
            >
              {page}
            </Text>
          </TouchableOpacity>
        )
      )}

      {/* Next Button */}
      <TouchableOpacity
        className="p-2 mx-1 rounded-md disabled:opacity-50"
        disabled={currentPage === totalPages}
        onPress={() => onPageChange(currentPage + 1)}
      >
        <Icon name={ChevronRight} className="text-foreground" />
      </TouchableOpacity>
    </View>
  );
};

export default Pagination;
