import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { useApp } from '../context/AppContext';
import { Event } from '../types/database';
import { Star } from 'lucide-react';

interface ReviewModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ event, isOpen, onClose }) => {
  const { currentUser, addReview } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [skillAccuracy, setSkillAccuracy] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState<string>('');

  if (!event) return null;

  const isHost = event.host_id === currentUser.id;
  // Available reviewees: if host, review approved players; if player, review host
  const candidateReviewees = isHost
    ? (event.registrations || [])
        .filter((r) => r.status === 'APPROVED' || r.status === 'CHECKED_IN')
        .map((r) => r.player!)
        .filter(Boolean)
    : [event.host!].filter(Boolean);

  const selectedTargetId = targetUserId || candidateReviewees[0]?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      alert('Không tìm thấy đối tượng đánh giá');
      return;
    }

    await addReview({
      event_id: event.id,
      reviewee_id: selectedTargetId,
      review_type: isHost ? 'HOST_TO_PLAYER' : 'PLAYER_TO_HOST',
      rating,
      skill_accuracy_rating: skillAccuracy,
      punctuality_rating: punctuality,
      comment,
      is_no_show: false,
    });

    alert('Cảm ơn bạn đã gửi đánh giá! Đánh giá giúp xây dựng cộng đồng cầu lông minh bạch và uy tín.');
    setComment('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={550}
      padding={4}
    >
      <VStack gap={4}>
        <DialogHeader
          title="Đánh Giá Buổi Giao Lưu"
          subtitle={`Sự kiện: ${event.title}`}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        <form onSubmit={handleSubmit}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Text weight="semibold">Người bạn muốn đánh giá:</Text>
              <select
                value={selectedTargetId}
                onChange={(e) => setTargetUserId(e.target.value)}
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                }}
              >
                {candidateReviewees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.id === event.host_id ? 'Chủ xị (Host)' : 'Vận động viên'})
                  </option>
                ))}
              </select>
            </VStack>

            {/* Overall Rating */}
            <VStack gap={1}>
              <Text weight="semibold">Mức độ hài lòng chung ({rating} / 5 sao):</Text>
              <HStack gap={1}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 'var(--spacing-1)',
                    }}
                  >
                    <Star
                      size={28}
                      color={s <= rating ? 'var(--color-warning)' : 'var(--color-border)'}
                      fill={s <= rating ? 'var(--color-warning)' : 'none'}
                    />
                  </button>
                ))}
              </HStack>
            </VStack>

            {/* Skill Accuracy */}
            <HStack gap={2} style={{ width: '100%' }}>
              <VStack gap={1} style={{ flex: 1 }}>
                <Text weight="semibold">Đánh giá đúng trình độ (1-5)</Text>
                <select
                  value={skillAccuracy}
                  onChange={(e) => setSkillAccuracy(Number(e.target.value))}
                  style={{
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-element)',
                    border: '1px solid var(--color-border)',
                    width: '100%',
                  }}
                >
                  <option value={5}>5 - Rất chuẩn xác theo mô tả</option>
                  <option value={4}>4 - Tương đối đúng</option>
                  <option value={3}>3 - Chênh lệch nhẹ</option>
                  <option value={2}>2 - Khai báo lệch nhiều</option>
                  <option value={1}>1 - Khai báo hoàn toàn sai</option>
                </select>
              </VStack>

              <VStack gap={1} style={{ flex: 1 }}>
                <Text weight="semibold">Độ đúng giờ (1-5)</Text>
                <select
                  value={punctuality}
                  onChange={(e) => setPunctuality(Number(e.target.value))}
                  style={{
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-element)',
                    border: '1px solid var(--color-border)',
                    width: '100%',
                  }}
                >
                  <option value={5}>5 - Đến sớm / Rất đúng giờ</option>
                  <option value={4}>4 - Đến đúng giờ</option>
                  <option value={3}>3 - Trễ 5-10 phút có báo</option>
                  <option value={2}>2 - Trễ nhiều không báo</option>
                  <option value={1}>1 - Bùng kèo</option>
                </select>
              </VStack>
            </HStack>

            {/* Comment */}
            <VStack gap={1}>
              <Text weight="semibold">Nhận xét chi tiết</Text>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận về thái độ, lối chơi, chất lượng sân..."
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                }}
              />
            </VStack>

            <HStack gap={2} style={{ justifyContent: 'flex-end', paddingTop: 'var(--spacing-2)' }}>
              <Button size="md" variant="ghost" label="Hủy" onClick={onClose} />
              <Button size="md" variant="primary" label="Gửi đánh giá" type="submit" />
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Dialog>
  );
};
