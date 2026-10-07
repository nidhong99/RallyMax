import React, { useState } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@astryxdesign/core/Table';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { Pagination } from '@astryxdesign/core/Pagination';
import { useApp } from '../context/AppContext';
import { MapPin, Plus } from 'lucide-react';

interface VenuesViewProps {
  onOpenAddVenue: () => void;
}

export const VenuesView: React.FC<VenuesViewProps> = ({ onOpenAddVenue }) => {
  const { venues, events } = useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = venues.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const startIdx = (safePage - 1) * pageSize;
  const paginatedVenues = venues.slice(startIdx, startIdx + pageSize);

  return (
    <VStack gap={4} style={{ width: '100%' }}>
      <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <VStack gap={0}>
          <Heading level={2}>Danh Mục Sân Cầu Lông</Heading>
          <Text color="secondary">Hệ thống sân cầu liên kết và được cộng đồng RallyMax đánh giá</Text>
        </VStack>

        <Button
          variant="primary"
          size="md"
          label="+ Thêm Sân Mới"
          onClick={onOpenAddVenue}
        />
      </HStack>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell style={{ width: '90px', minWidth: '90px', whiteSpace: 'nowrap' }}>Ảnh bìa</TableHeaderCell>
            <TableHeaderCell>Tên sân</TableHeaderCell>
            <TableHeaderCell>Địa chỉ</TableHeaderCell>
            <TableHeaderCell style={{ width: '160px' }}>Số kèo đang tổ chức</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedVenues.map((venue) => {
            const eventCount = events.filter((e) => e.venue_id === venue.id && e.status === 'OPEN').length;

            return (
              <TableRow key={venue.id}>
                <TableCell style={{ width: '90px', minWidth: '90px', verticalAlign: 'middle' }}>
                  {venue.image_url ? (
                    <Thumbnail
                      src={venue.image_url}
                      alt={venue.name}
                      label={venue.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <HStack
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'var(--color-surface-sunken)',
                        borderRadius: 'var(--radius-md)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--color-border)',
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={20} color="var(--color-icon-tertiary)" />
                    </HStack>
                  )}
                </TableCell>
                <TableCell>
                  <HStack gap={1} style={{ alignItems: 'center' }}>
                    <MapPin size={16} color="var(--color-icon-accent)" />
                    <Text weight="semibold">{venue.name}</Text>
                  </HStack>
                </TableCell>
                <TableCell>
                  <Text>{venue.address}</Text>
                </TableCell>
                <TableCell>
                  <Text weight="bold" color={eventCount > 0 ? 'accent' : 'secondary'}>
                    {eventCount} kèo mở
                  </Text>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalItems > 0 && (
        <HStack
          gap={2}
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacing-3) 0',
            flexWrap: 'wrap',
          }}
        >
          <Text type="supporting" color="secondary" style={{ fontSize: '13px' }}>
            Hiển thị {startIdx + 1} - {Math.min(startIdx + pageSize, totalItems)} trong tổng số {totalItems} sân
          </Text>
          <Pagination
            page={safePage}
            onChange={setPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            variant="pages"
            size="sm"
          />
        </HStack>
      )}
    </VStack>
  );
};
