import React from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Button } from '@astryxdesign/core/Button';
import { useApp } from '../context/AppContext';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const { isRealSupabase } = useApp();

  const handleCopyEnv = () => {
    const envSnippet = `VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co\nVITE_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>`;
    navigator.clipboard.writeText(envSnippet);
    alert('Đã copy mẫu biến môi trường vào clipboard!');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={680}
      padding={4}
    >
      <VStack gap={4}>
        <DialogHeader
          title="Kết Nối Supabase & Database BCNF"
          subtitle="Hướng dẫn tích hợp Supabase với Google/Facebook OAuth cho RallyMax"
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        {/* Current Connection Status */}
        <HStack
          gap={2}
          style={{
            padding: 'var(--spacing-3)',
            background: isRealSupabase ? 'var(--color-background-green)' : 'var(--color-background-yellow)',
            borderRadius: 'var(--radius-element)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <HStack gap={2} style={{ alignItems: 'center' }}>
            <StatusDot
              label={isRealSupabase ? 'Đã kết nối trực tiếp với Supabase!' : 'Đang chạy chế độ Demo Interactive'}
              variant={isRealSupabase ? 'success' : 'warning'}
            />
            <VStack gap={0}>
              <Text weight="bold">
                {isRealSupabase ? 'Đã kết nối trực tiếp với Supabase!' : 'Đang chạy chế độ Demo Interactive'}
              </Text>
              <Text type="supporting" color="secondary">
                {isRealSupabase
                  ? 'Dữ liệu được đồng bộ trực tiếp với cloud database'
                  : 'Mọi thao tác tạo kèo, duyệt, check-in đều hoạt động mượt mà trên browser'}
              </Text>
            </VStack>
          </HStack>

          <Badge
            variant={isRealSupabase ? 'green' : 'yellow'}
            label={isRealSupabase ? 'Live Cloud' : 'Local Mock Ready'}
          />
        </HStack>

        {/* Quick steps summary */}
        <VStack gap={3}>
          <Heading level={4}>
            Các bước thiết lập Supabase theo file SUPABASE_SETUP_GUIDE.md:
          </Heading>

          <VStack gap={2}>
            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <Badge variant="blue" label="Bước 1" />
              <Text>Tạo dự án mới trên Supabase Console (chọn Region Singapore).</Text>
            </HStack>

            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <Badge variant="blue" label="Bước 2" />
              <Text>
                Bật <strong>Google</strong> & <strong>Facebook Login</strong> trong tab Authentication &gt; Providers.
              </Text>
            </HStack>

            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <Badge variant="blue" label="Bước 3" />
              <Text>
                Mở <strong>SQL Editor</strong> và chạy toàn bộ script DDL chuẩn <strong>BCNF</strong> trong file hướng dẫn.
              </Text>
            </HStack>

            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <Badge variant="blue" label="Bước 4" />
              <Text>Chạy script Trigger tự động sync User từ OAuth sang bảng profiles.</Text>
            </HStack>

            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <Badge variant="blue" label="Bước 5" />
              <Text>Tạo 2 bucket trong Storage: <code>avatars</code> và <code>event-covers</code>.</Text>
            </HStack>

            <HStack gap={2} style={{ alignItems: 'flex-start' }}>
              <Badge variant="blue" label="Bước 6" />
              <Text>Lấy Project URL và Anon Key dán vào file <code>.env</code> của dự án.</Text>
            </HStack>
          </VStack>
        </VStack>

        <HStack gap={2} style={{ justifyContent: 'space-between', paddingTop: 'var(--spacing-2)' }}>
          <Button
            size="md"
            variant="secondary"
            label="Copy mẫu .env"
            onClick={handleCopyEnv}
          />
          <Button size="md" variant="primary" label="Đã hiểu" onClick={onClose} />
        </HStack>
      </VStack>
    </Dialog>
  );
};
