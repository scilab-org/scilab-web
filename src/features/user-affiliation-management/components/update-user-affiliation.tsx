import * as React from 'react';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useUpdateUserAffiliation } from '../api/update-user-affiliation';
import { FIELD_LABEL_CLASS } from '../constants';
import { UserAffiliationDto } from '../types';

interface UpdateUserAffiliationProps {
  userAffiliationId: string;
  userAffiliation: UserAffiliationDto;
}

const initialFormData = {
  department: '',
  position: '',
  affiliationStartYear: '',
  affiliationEndYear: '',
};

export const UpdateUserAffiliation = ({
  userAffiliationId,
  userAffiliation,
}: UpdateUserAffiliationProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const mutation = useUpdateUserAffiliation({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Affiliation updated successfully');
      },
      onError: () => toast.error('Failed to update affiliation'),
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        department: userAffiliation.department ?? '',
        position: userAffiliation.position ?? '',
        affiliationStartYear: userAffiliation.affiliationStartYear
          ? String(userAffiliation.affiliationStartYear)
          : '',
        affiliationEndYear: userAffiliation.affiliationEndYear
          ? String(userAffiliation.affiliationEndYear)
          : '',
      });
    }
  }, [open, userAffiliation]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const affiliationStartYear = Number(formData.affiliationStartYear);

    if (!Number.isFinite(affiliationStartYear)) {
      toast.error('Start year is required');
      return;
    }

    mutation.mutate({
      userAffiliationId,
      data: {
        userId: userAffiliation.userId,
        affiliationId: userAffiliation.affiliation.id,
        department: formData.department.trim(),
        position: formData.position.trim(),
        affiliationStartYear,
        affiliationEndYear: formData.affiliationEndYear
          ? Number(formData.affiliationEndYear)
          : null,
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setFormData(initialFormData);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outlineAction">EDIT</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit User Affiliation</DialogTitle>
          <DialogDescription>
            Update the affiliation details for{' '}
            {userAffiliation.affiliation.name}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="update-user-affiliation-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="ufa-department" className={FIELD_LABEL_CLASS}>
              Department <span className="text-destructive">*</span>
            </label>
            <Input
              id="ufa-department"
              value={formData.department}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, department: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ufa-position" className={FIELD_LABEL_CLASS}>
              Position <span className="text-destructive">*</span>
            </label>
            <Input
              id="ufa-position"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, position: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="ufa-start-year" className={FIELD_LABEL_CLASS}>
                Start Year <span className="text-destructive">*</span>
              </label>
              <Input
                id="ufa-start-year"
                type="number"
                value={formData.affiliationStartYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    affiliationStartYear: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ufa-end-year" className={FIELD_LABEL_CLASS}>
                End Year
              </label>
              <Input
                id="ufa-end-year"
                type="number"
                value={formData.affiliationEndYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    affiliationEndYear: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFormData(initialFormData);
              setOpen(false);
            }}
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="update-user-affiliation-form"
            variant="darkRed"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader /> : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
