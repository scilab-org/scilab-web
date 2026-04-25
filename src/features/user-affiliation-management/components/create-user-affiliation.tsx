import * as React from 'react';
import { Loader, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAffiliations } from '@/features/affiliation-management/api/get-affiliations';
import type { AffiliationDto } from '@/features/affiliation-management/types';

import { useCreateUserAffiliation } from '../api/create-user-affiliation';
import { useUserAffiliations } from '../api/get-user-affiliations';
import { FIELD_LABEL_CLASS } from '../constants';

const initialFormData = {
  affiliationId: '',
  department: '',
  position: '',
  affiliationStartYear: '',
  affiliationEndYear: '',
};

export const CreateUserAffiliation = ({ userId }: { userId: string }) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const affiliationsQuery = useAffiliations({
    params: { PageNumber: 1, PageSize: 500 },
  });
  const userAffiliationsQuery = useUserAffiliations({ userId });

  const affiliationOptions = React.useMemo(() => {
    const userAffiliationIds = new Set(
      (userAffiliationsQuery.data?.result ?? []).map(
        (item) => item.affiliation.id,
      ),
    );

    return (
      (affiliationsQuery.data?.result?.items as AffiliationDto[] | undefined) ??
      []
    )
      .filter((affiliation) => !userAffiliationIds.has(affiliation.id))
      .map((affiliation) => ({
        label: affiliation.name,
        value: affiliation.id,
      }));
  }, [
    affiliationsQuery.data?.result?.items,
    userAffiliationsQuery.data?.result,
  ]);

  const mutation = useCreateUserAffiliation({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Affiliation created successfully');
      },
      onError: () => {
        toast.error('Failed to create affiliation');
      },
    },
  });

  const resetForm = () => setFormData(initialFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutation.mutate({
      userId,
      affiliationId: formData.affiliationId,
      department: formData.department,
      position: formData.position,
      affiliationStartYear: formData.affiliationStartYear
        ? Number(formData.affiliationStartYear)
        : null,
      affiliationEndYear: formData.affiliationEndYear
        ? Number(formData.affiliationEndYear)
        : null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="darkRed">
          <Plus className="size-4" />
          Add Affiliation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Affiliation</DialogTitle>
          <DialogDescription>
            Link an existing affiliation to this user.
          </DialogDescription>
        </DialogHeader>

        <form
          id="user-affiliation-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="ua-affiliationId" className={FIELD_LABEL_CLASS}>
              Affiliation <span className="text-destructive">*</span>
            </label>
            <FilterDropdown
              value={formData.affiliationId}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, affiliationId: value }))
              }
              placeholder="Select affiliation"
              clearLabel="Select affiliation"
              variant="outline"
              options={affiliationOptions}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ua-department" className={FIELD_LABEL_CLASS}>
              Department <span className="text-destructive">*</span>
            </label>
            <Input
              id="ua-department"
              value={formData.department}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, department: e.target.value }))
              }
              placeholder="Department"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ua-position" className={FIELD_LABEL_CLASS}>
              Position <span className="text-destructive">*</span>
            </label>
            <Input
              id="ua-position"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, position: e.target.value }))
              }
              placeholder="Position"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="ua-start-year" className={FIELD_LABEL_CLASS}>
                Start Year
              </label>
              <Input
                id="ua-start-year"
                type="number"
                value={formData.affiliationStartYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    affiliationStartYear: e.target.value,
                  }))
                }
                placeholder="2020"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ua-end-year" className={FIELD_LABEL_CLASS}>
                End Year
              </label>
              <Input
                id="ua-end-year"
                type="number"
                value={formData.affiliationEndYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    affiliationEndYear: e.target.value,
                  }))
                }
                placeholder="2024"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="user-affiliation-form"
            variant="darkRed"
            disabled={
              mutation.isPending ||
              affiliationsQuery.isLoading ||
              userAffiliationsQuery.isLoading ||
              !formData.affiliationId
            }
          >
            {mutation.isPending ? <Loader /> : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
