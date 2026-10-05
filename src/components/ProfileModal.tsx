import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { useApp } from '../context/AppContext';
import { SkillLevel, DominantHand, PlayStyle, SKILL_LABELS, PLAY_STYLE_LABELS } from '../types/database';
import { DISTRICTS } from '../constants/locations';
import { Shield, Star } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, reviews } = useApp();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone_number || '');
  const [gender, setGender] = useState(currentUser?.gender || 'OTHER');
  const [birthYear, setBirthYear] = useState(currentUser?.birth_year ? String(currentUser.birth_year) : '1998');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(currentUser?.skill_level || 'BEGINNER');
  const [dominantHand, setDominantHand] = useState<DominantHand>(currentUser?.dominant_hand || 'RIGHT');
  const [playStyle, setPlayStyle] = useState<PlayStyle>(currentUser?.play_style || 'ALL_ROUND');
  const [districtCode, setDistrictCode] = useState(currentUser?.district_code || 'HN_BD');
  const [bio, setBio] = useState(currentUser?.bio || '');

  const [activeTab, setActiveTab] = useState<'profile' | 'reviews'>('profile');

  // Sync state when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setPhone(currentUser.phone_number || '');
      setGender(currentUser.gender || 'OTHER');
      setBirthYear(currentUser.birth_year ? String(currentUser.birth_year) : '1998');
      setSkillLevel(currentUser.skill_level || 'BEGINNER');
      setDominantHand(currentUser.dominant_hand || 'RIGHT');
      setPlayStyle(currentUser.play_style || 'ALL_ROUND');
      setDistrictCode(currentUser.district_code || 'HN_BD');
      setBio(currentUser.bio || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Reviews received by current user
  const userReviews = reviews.filter((r) => r.reviewee_id === currentUser.id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName,
      phone_number: phone,
      gender,
      birth_year: Number(birthYear) || undefined,
      skill_level: skillLevel,
      dominant_hand: dominantHand,
      play_style: playStyle,
      district_code: districtCode,
      bio,
    });
    alert('Đã cập nhật thông tin hồ sơ thành công!');
    onClose();
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
          title="Hồ Sơ Cầu Lông & Điểm Uy Tín"
          subtitle="Thông tin chuyên môn để Host và Player dễ dàng ghép cặp chuẩn trình độ"
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        {/* Reputation Score Card */}
        <HStack
          gap={3}
          style={{
            padding: 'var(--spacing-3)',
            background: 'var(--color-background-muted)',
            borderRadius: 'var(--radius-element)',
            border: '1px solid var(--color-border)',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <VStack gap={1}>
            <HStack gap={1} style={{ alignItems: 'center' }}>
              <Shield size={18} color="var(--color-success)" />
              <Text weight="bold">Điểm uy tín (Reliability): {currentUser.reliability_score}%</Text>
            </HStack>
            <Text type="supporting" color="secondary">
              Tham gia {currentUser.total_matches_played} trận • Bùng kèo: {currentUser.total_no_shows} lần
            </Text>
          </VStack>

          <Badge
            variant={currentUser.reliability_score >= 95 ? 'green' : currentUser.reliability_score >= 80 ? 'yellow' : 'red'}
            label={currentUser.reliability_score >= 95 ? 'Vận động viên uy tín' : 'Cần cải thiện'}
          />
        </HStack>

        {/* Tab switch */}
        <HStack gap={2}>
          <Button
            size="sm"
            variant={activeTab === 'profile' ? 'primary' : 'ghost'}
            label="Chỉnh sửa thông số cầu lông"
            onClick={() => setActiveTab('profile')}
          />
          <Button
            size="sm"
            variant={activeTab === 'reviews' ? 'primary' : 'ghost'}
            label={`Đánh giá từ cộng đồng (${userReviews.length})`}
            onClick={() => setActiveTab('reviews')}
          />
        </HStack>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSave}>
            <VStack gap={3}>
              {/* Basic Details */}
              <HStack gap={2} style={{ width: '100%' }}>
                <VStack gap={1} style={{ flex: 1 }}>
                  <Text weight="semibold">Họ và tên *</Text>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  />
                </VStack>

                <VStack gap={1} style={{ width: '180px' }}>
                  <Text weight="semibold">Số điện thoại</Text>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  />
                </VStack>

                <VStack gap={1} style={{ width: '120px' }}>
                  <Text weight="semibold">Giới tính</Text>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </VStack>
              </HStack>

              {/* Badminton Traits */}
              <HStack gap={2} style={{ width: '100%' }}>
                <VStack gap={1} style={{ flex: 1 }}>
                  <Text weight="semibold">Trình độ cầu lông (VN) *</Text>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  >
                    {Object.entries(SKILL_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label} - {v.desc}
                      </option>
                    ))}
                  </select>
                </VStack>

                <VStack gap={1} style={{ width: '150px' }}>
                  <Text weight="semibold">Tay thuận</Text>
                  <select
                    value={dominantHand}
                    onChange={(e) => setDominantHand(e.target.value as DominantHand)}
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  >
                    <option value="RIGHT">Tay Phải</option>
                    <option value="LEFT">Tay Trái</option>
                    <option value="BOTH">Hai tay</option>
                  </select>
                </VStack>
              </HStack>

              <HStack gap={2} style={{ width: '100%' }}>
                <VStack gap={1} style={{ flex: 1 }}>
                  <Text weight="semibold">Vị trí / Lối đánh sở trường</Text>
                  <select
                    value={playStyle}
                    onChange={(e) => setPlayStyle(e.target.value as PlayStyle)}
                    style={{
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-element)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  >
                    {Object.entries(PLAY_STYLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </VStack>

                <VStack gap={1} style={{ flex: 1 }}>
                  <Text weight="semibold">Khu vực sinh hoạt chính</Text>
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
              </HStack>

              {/* Bio */}
              <VStack gap={1}>
                <Text weight="semibold">Giới thiệu ngắn (Dòng vợt, kinh nghiệm)</Text>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ví dụ: Đánh vợt Yonex 88D Pro, mê công cầu sau, thích giao lưu học hỏi..."
                  style={{
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-element)',
                    border: '1px solid var(--color-border)',
                    width: '100%',
                  }}
                />
              </VStack>

              <HStack gap={2} style={{ justifyContent: 'flex-end', paddingTop: 'var(--spacing-2)' }}>
                <Button size="md" variant="ghost" label="Đóng" onClick={onClose} />
                <Button size="md" variant="primary" label="Lưu thay đổi" type="submit" />
              </HStack>
            </VStack>
          </form>
        ) : (
          <VStack gap={3}>
            {userReviews.length === 0 ? (
              <VStack gap={2} style={{ padding: 'var(--spacing-4)', alignItems: 'center' }}>
                <Text color="secondary">Chưa có đánh giá nào từ cộng đồng.</Text>
              </VStack>
            ) : (
              userReviews.map((r) => (
                <VStack
                  key={r.id}
                  gap={1}
                  style={{
                    padding: 'var(--spacing-3)',
                    background: 'var(--color-background-muted)',
                    borderRadius: 'var(--radius-element)',
                  }}
                >
                  <HStack gap={2} style={{ justifyContent: 'space-between' }}>
                    <Text weight="bold">{r.reviewer?.full_name || 'Người chơi'}</Text>
                    <HStack gap={1} style={{ alignItems: 'center' }}>
                      <Star size={16} color="var(--color-warning)" fill="var(--color-warning)" />
                      <Text weight="bold">{r.rating}/5 sao</Text>
                    </HStack>
                  </HStack>
                  <Text>{r.comment}</Text>
                  <Text type="supporting" color="secondary">
                    {new Date(r.created_at).toLocaleDateString('vi-VN')}
                  </Text>
                </VStack>
              ))
            )}
          </VStack>
        )}
      </VStack>
    </Dialog>
  );
};
