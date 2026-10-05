import React from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@astryxdesign/core/Table';
import { useApp } from '../context/AppContext';
import { MapPin, Plus } from 'lucide-react';

interface VenuesViewProps {
  onOpenAddVenue: () => void;
}

export const VenuesView: React.FC<VenuesViewProps> = ({ onOpenAddVenue }) => {
  const { venues, events } = useApp();

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
            <TableHeaderCell>Tên sân</TableHeaderCell>
            <TableHeaderCell>Địa chỉ</TableHeaderCell>
            <TableHeaderCell>Số kèo đang tổ chức</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((venue) => {
            const eventCount = events.filter((e) => e.venue_id === venue.id && e.status === 'OPEN').length;

            return (
              <TableRow key={venue.id}>
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
    </VStack>
  );
};
