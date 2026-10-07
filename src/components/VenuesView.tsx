import React, { useState } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@astryxdesign/core/Table';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { useApp } from '../context/AppContext';
import { MapPin, ExternalLink, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { Venue } from '../types/database';
import { DISTRICTS } from '../constants/locations';

interface VenuesViewProps {
  onOpenAddVenue: () => void;
}

export const VenuesView: React.FC<VenuesViewProps> = ({ onOpenAddVenue }) => {
  const { venues, events } = useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const totalItems = venues.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const startIdx = (safePage - 1) * pageSize;
  const paginatedVenues = venues.slice(startIdx, startIdx + pageSize);

  const handleOpenVenueDetails = (venue: Venue) => {
    setSelectedVenue(venue);
    setActiveGalleryIndex(0);
  };

  const handleCloseDetails = () => {
    setSelectedVenue(null);
    setActiveGalleryIndex(0);
  };

  // Lấy danh sách ảnh hiển thị (tối đa 10 ảnh, hoặc tất cả ảnh hiện có nếu ít hơn 10)
  const venueGallery = selectedVenue ? (
    (selectedVenue.gallery_images && selectedVenue.gallery_images.length > 0)
      ? selectedVenue.gallery_images.slice(0, 10)
      : (selectedVenue.image_url ? [selectedVenue.image_url] : [])
  ) : [];

  const currentBigImage = venueGallery[activeGalleryIndex] || selectedVenue?.image_url;

  return (
    <VStack gap={4} style={{ width: '100%' }}>
      <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <VStack gap={0}>
          <Heading level={2}>Danh Mục Sân Cầu Lông</Heading>
          <Text color="secondary">Hệ thống sân cầu liên kết và được cộng đồng RallyMax đánh giá kèm ảnh thực tế</Text>
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
            <TableHeaderCell style={{ width: '100px', minWidth: '100px', whiteSpace: 'nowrap' }}>Ảnh bìa</TableHeaderCell>
            <TableHeaderCell>Tên sân</TableHeaderCell>
            <TableHeaderCell>Địa chỉ</TableHeaderCell>
            <TableHeaderCell style={{ width: '160px' }}>Số kèo đang tổ chức</TableHeaderCell>
            <TableHeaderCell style={{ width: '110px', textAlign: 'right' }}>Chi tiết</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedVenues.map((venue) => {
            const eventCount = events.filter((e) => e.venue_id === venue.id && e.status === 'OPEN').length;
            const photoCount = venue.gallery_images?.length || (venue.image_url ? 1 : 0);

            return (
              <TableRow
                key={venue.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenVenueDetails(venue)}
              >
                <TableCell style={{ width: '100px', minWidth: '100px', verticalAlign: 'middle' }}>
                  {venue.image_url ? (
                    <HStack
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: 'var(--radius-container, 12px)',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-sunken)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={venue.image_url}
                        alt={venue.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          borderRadius: 'var(--radius-container, 12px)',
                        }}
                      />
                      {photoCount > 1 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '3px',
                            right: '3px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            lineHeight: '1.2',
                            pointerEvents: 'none',
                          }}
                        >
                          +{photoCount}
                        </span>
                      )}
                    </HStack>
                  ) : (
                    <HStack
                      style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'var(--color-surface-sunken)',
                        borderRadius: 'var(--radius-container, 12px)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--color-border)',
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={22} color="var(--color-icon-tertiary)" />
                    </HStack>
                  )}
                </TableCell>
                <TableCell>
                  <VStack gap={0}>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <MapPin size={16} color="var(--color-icon-accent)" />
                      <Text weight="semibold">{venue.name}</Text>
                    </HStack>
                    {(() => {
                      const d = DISTRICTS.find((item) => item.code === venue.district_code);
                      if (d) {
                        const cityName = d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng';
                        return (
                          <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                            {d.name}, {cityName}
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </VStack>
                </TableCell>
                <TableCell>
                  <Text>{venue.address}</Text>
                </TableCell>
                <TableCell>
                  <Text weight="bold" color={eventCount > 0 ? 'accent' : 'secondary'}>
                    {eventCount} kèo mở
                  </Text>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    label="Xem ảnh"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenVenueDetails(venue);
                    }}
                  />
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

      {/* MODAL: Chi Tiết Sân & Thư Viện 10 Ảnh Thực Tế */}
      <Dialog
        isOpen={!!selectedVenue}
        onOpenChange={(open) => {
          if (!open) handleCloseDetails();
        }}
        purpose="info"
        width={680}
        maxHeight="92dvh"
      >
        <Layout
          height="fill"
          header={
            <DialogHeader
              title={selectedVenue?.name || 'Chi Tiết Sân Cầu Lông'}
              subtitle={selectedVenue?.address || ''}
              hasDivider={true}
              onOpenChange={(open) => {
                if (!open) handleCloseDetails();
              }}
            />
          }
          content={
            <LayoutContent isScrollable={true} padding={4} style={{ overflowY: 'auto' }}>
              <VStack gap={4} style={{ width: '100%' }}>
                {/* 1. Khung Ảnh Banner Lớn (Hero Preview) */}
                <VStack gap={2} style={{ width: '100%' }}>
                  <HStack
                    style={{
                      width: '100%',
                      height: '240px',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--color-surface-sunken)',
                      border: '1px solid var(--color-border)',
                      position: 'relative',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {currentBigImage ? (
                      <img
                        src={currentBigImage}
                        alt={selectedVenue?.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <VStack gap={2} style={{ alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                        <ImageIcon size={48} color="var(--color-icon-tertiary)" />
                        <Text color="secondary">Sân chưa có ảnh thực tế</Text>
                      </VStack>
                    )}

                    {/* Badge đếm ảnh */}
                    {venueGallery.length > 0 && (
                      <Badge
                        variant="blue"
                        label={`Ảnh ${activeGalleryIndex + 1} / ${venueGallery.length}`}
                        style={{
                          position: 'absolute',
                          bottom: 'var(--spacing-3)',
                          right: 'var(--spacing-3)',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    )}
                  </HStack>
                </VStack>

                {/* 2. Thư Viện Thumbnail (Tối đa 10 ảnh - Click chuyển ảnh) */}
                {venueGallery.length > 0 && (
                  <VStack gap={2} style={{ width: '100%' }}>
                    <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text weight="semibold" style={{ fontSize: '13px' }}>
                        Thư viện ảnh sân thực tế ({venueGallery.length} ảnh)
                      </Text>
                      <Text type="supporting" color="secondary" style={{ fontSize: '11px' }}>
                        Bấm vào ảnh để xem góc sân tương ứng
                      </Text>
                    </HStack>

                    <HStack
                      gap={2}
                      style={{
                        width: '100%',
                        overflowX: 'auto',
                        paddingBottom: 'var(--spacing-2)',
                        scrollbarWidth: 'thin',
                      }}
                    >
                      {venueGallery.map((imgUrl, idx) => {
                        const isActive = idx === activeGalleryIndex;
                        return (
                          <button
                            key={`${imgUrl}-${idx}`}
                            type="button"
                            onClick={() => setActiveGalleryIndex(idx)}
                            title={`Xem ảnh ${idx + 1}`}
                            style={{
                              padding: 0,
                              margin: 0,
                              background: 'transparent',
                              border: isActive
                                ? '2px solid var(--color-primary-base, #3b82f6)'
                                : '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              width: '74px',
                              height: '54px',
                              flexShrink: 0,
                              transition: 'transform 0.15s ease',
                              opacity: isActive ? 1 : 0.75,
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          </button>
                        );
                      })}
                    </HStack>
                  </VStack>
                )}

                {/* 3. Thông tin chi tiết sân */}
                <VStack
                  gap={2}
                  style={{
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'var(--color-surface-sunken)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <HStack gap={2} style={{ alignItems: 'flex-start' }}>
                    <MapPin size={18} color="var(--color-icon-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <VStack gap={0}>
                      <Text weight="semibold">{selectedVenue?.address}</Text>
                      {(() => {
                        const d = DISTRICTS.find((item) => item.code === selectedVenue?.district_code);
                        if (d) {
                          const cityName = d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng';
                          return (
                            <Text type="supporting" color="secondary" style={{ fontSize: '12px' }}>
                              Khu vực: {d.name}, {cityName}
                            </Text>
                          );
                        }
                        return null;
                      })()}
                    </VStack>
                  </HStack>

                  {selectedVenue?.maps_url && (
                    <HStack style={{ marginTop: 'var(--spacing-1)' }}>
                      <a
                        href={selectedVenue.maps_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--color-primary-base, #3b82f6)',
                          fontSize: '13px',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        <ExternalLink size={14} />
                        Mở Google Maps chỉ đường tới sân
                      </a>
                    </HStack>
                  )}
                </VStack>
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider={true} style={{ background: 'var(--color-background-surface)' }}>
              <HStack gap={2} hAlign="end" style={{ justifyContent: 'flex-end', width: '100%' }}>
                <Button size="md" variant="primary" label="Đóng" onClick={handleCloseDetails} />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </VStack>
  );
};
