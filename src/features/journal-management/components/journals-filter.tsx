import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { BTN } from '@/lib/button-styles';

export const JournalsFilter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filterState, setFilterState] = React.useState({
    name: searchParams.get('name') || '',
    isDeleted: searchParams.get('isDeleted') === 'true',
  });

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (filterState.name) params.set('name', filterState.name);
    if (filterState.isDeleted) params.set('isDeleted', 'true');
    params.set('page', '1');
    navigate(`?${params.toString()}`);
  };

  const handleReset = () => {
    setFilterState({ name: '', isDeleted: false });
    navigate('?page=1');
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search by journal name..."
        value={filterState.name}
        onChange={(e) =>
          setFilterState((prev) => ({ ...prev, name: e.target.value }))
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleFilter();
          }
        }}
      />
      <Button onClick={handleFilter} variant="outline">
        Search
      </Button>
      <Button onClick={handleReset} variant="ghost" className={BTN.CANCEL}>
        Reset
      </Button>
    </div>
  );
};
