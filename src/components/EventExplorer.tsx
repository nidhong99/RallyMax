import React, { useState } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { EventCard } from './EventCard';
import { Event, SKILL_LABELS } from '../types/database';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { MOCK_DISTRICTS } from '../data/mockData';

interface EventExplorerProps {
  onSelectEvent: (event: Event) => void;
  onOpenCreateEvent: () => void;
}

export const EventExplorer: React.FC<EventExplorerProps> = ({
  onSelectEvent,
  onOpenCreateEvent,
}) => {
  const { events, currentUser } = useApp();
  const { t } = useLanguage();
  const isHost = currentUser?.role === 'HOST' || (currentUser?.email || '').toLowerCase() === 'nidhong99@gmail.com';

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Filter logic
  const filteredEvents = events.filter((e) => {
    // Search keyword
    const matchSearch =
      !searchTerm ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.venue_name || e.venue?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.venue?.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    // District filter
    const matchDistrict =
      districtFilter === 'ALL' || e.venue?.district_code === districtFilter;

    // Skill filter
    const matchSkill =
      skillFilter === 'ALL' ||
      e.min_skill_level === skillFilter ||
      e.max_skill_level === skillFilter;

    // Availability
    const approvedCount = (e.registrations || []).filter(
      (r) => r.status === 'APPROVED' || r.status === 'CHECKED_IN'
    ).length;
    const isFull = approvedCount >= e.max_players;
    const matchAvailable = !onlyAvailable || (!isFull && e.status === 'OPEN');

    return matchSearch && matchDistrict && matchSkill && matchAvailable;
  });

  return (
    <VStack gap={4} style={{ width: '100%' }}>
      {/* Hero Banner with Modern Badminton Theme */}
      <VStack
        gap={1}
        style={{
          padding: 'var(--spacing-5)',
          background: 'linear-gradient(135deg, var(--color-background-surface) 0%, var(--color-background-muted) 100%)',
          borderRadius: 'var(--radius-container)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-low)',
        }}
      >
        <Heading level={2}>
          {t('explorer.heroTitle')}
        </Heading>
        <Text color="secondary" type="large">
          {t('explorer.heroSubtitle')}
        </Text>
      </VStack>

      {/* Filter Toolbar */}
      <HStack
        gap={2}
        style={{
          padding: 'var(--spacing-3)',
          background: 'var(--color-background-surface)',
          borderRadius: 'var(--radius-element)',
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search input */}
        <VStack gap={1} style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('explorer.searchPlaceholder')}
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-element)',
              border: '1px solid var(--color-border)',
              width: '100%',
              fontSize: '14px',
            }}
          />
        </VStack>

        {/* District Selector */}
        <VStack gap={1} style={{ width: '180px' }}>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-element)',
              border: '1px solid var(--color-border)',
              width: '100%',
              fontSize: '14px',
            }}
          >
            <option value="ALL">{t('explorer.allDistricts')}</option>
            {MOCK_DISTRICTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} ({d.province_code})
              </option>
            ))}
          </select>
        </VStack>

        {/* Skill Selector */}
        <VStack gap={1} style={{ width: '180px' }}>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-element)',
              border: '1px solid var(--color-border)',
              width: '100%',
              fontSize: '14px',
            }}
          >
            <option value="ALL">{t('explorer.allSkills')}</option>
            {Object.entries(SKILL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {t(`skills.${k}.label`) || v.label}
              </option>
            ))}
          </select>
        </VStack>

        {/* Only available toggle */}
        <HStack gap={1} style={{ alignItems: 'center' }}>
          <input
            type="checkbox"
            id="availOnly"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="availOnly" style={{ cursor: 'pointer' }}>
            <Text type="supporting" weight="medium">{t('explorer.availableOnly')}</Text>
          </label>
        </HStack>

        {/* Reset button */}
        {(searchTerm || districtFilter !== 'ALL' || skillFilter !== 'ALL' || onlyAvailable) && (
          <Button
            size="sm"
            variant="ghost"
            label={t('explorer.reset')}
            onClick={() => {
              setSearchTerm('');
              setDistrictFilter('ALL');
              setSkillFilter('ALL');
              setOnlyAvailable(false);
            }}
          />
        )}
      </HStack>

      {/* Results Header */}
      <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text weight="bold">
          {t('explorer.foundCount', { count: filteredEvents.length })}
        </Text>
      </HStack>

      {/* Events Grid */}
      {events.length === 0 ? (
        <VStack
          gap={3}
          style={{
            padding: 'var(--spacing-8) var(--spacing-4)',
            alignItems: 'center',
            textAlign: 'center',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-container)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-low)',
          }}
        >
          <Text style={{ fontSize: '40px' }}>🏸</Text>
          <VStack gap={1} style={{ alignItems: 'center' }}>
            <Heading level={3}>{t('explorer.noEvents')}</Heading>
            <Text color="secondary" style={{ maxWidth: '480px' }}>
              {t('explorer.noEventsDesc')}
            </Text>
          </VStack>

          {isHost && (
            <Button
              variant="primary"
              size="lg"
              label={`+ ${t('explorer.createNow')}`}
              onClick={onOpenCreateEvent}
            />
          )}
        </VStack>
      ) : filteredEvents.length === 0 ? (
        <VStack
          gap={2}
          style={{
            padding: 'var(--spacing-8)',
            alignItems: 'center',
            textAlign: 'center',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-container)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Text type="large" weight="semibold">{t('explorer.noEvents')}</Text>
          <Text color="secondary">
            {t('explorer.noEventsDesc')}
          </Text>
        </VStack>
      ) : (
        <HStack
          gap={3}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            width: '100%',
          }}
        >
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
            />
          ))}
        </HStack>
      )}
    </VStack>
  );
};
