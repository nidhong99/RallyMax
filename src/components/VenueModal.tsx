import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { useApp } from '../context/AppContext';
import { DISTRICTS } from '../constants/locations';

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VenueModal: React.FC<VenueModalProps> = ({ isOpen, onClose }) => {
  const { createVenue } = useApp();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [districtCode, setDistrictCode] = useState('HN_BD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert('Vui lòng nhập tên và địa chỉ sân');
      return;
    }

    await createVenue({
      name,
      address,
      district_code: districtCode,
    });

    alert('Đã thêm sân cầu lông vào danh mục!');
    setName('');
    setAddress('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={500}
      padding={4}
    >
      <VStack gap={4}>
        <DialogHeader
          title="Thêm Sân Cầu Lông Mới"
          subtitle="Bổ sung địa điểm sân vào hệ thống RallyMax"
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        <form onSubmit={handleSubmit}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Text weight="semibold">Tên sân cầu lông *</Text>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Sân Cầu Lông Quân Khu 7"
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                }}
              />
            </VStack>

            <VStack gap={1}>
              <Text weight="semibold">Địa chỉ cụ thể *</Text>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: 202 Hoàng Văn Thụ, Phường 9"
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                }}
              />
            </VStack>

            <VStack gap={1} style={{ width: '100%' }}>
              <Text weight="semibold">Quận / Huyện</Text>
              <select
                value={districtCode}
                onChange={(e) => setDistrictCode(e.target.value)}
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                }}
              >
                {DISTRICTS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.province_code === 'HN' ? 'Hà Nội' : d.province_code === 'HCM' ? 'TP.HCM' : 'Đà Nẵng'})
                  </option>
                ))}
              </select>
            </VStack>

            <HStack gap={2} style={{ justifyContent: 'flex-end', paddingTop: 'var(--spacing-2)' }}>
              <Button size="md" variant="ghost" label="Hủy" onClick={onClose} />
              <Button size="md" variant="primary" label="Lưu sân" type="submit" />
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Dialog>
  );
};
