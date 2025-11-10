'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Save, RotateCcw } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from '@/components/ui';

const ShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  window: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Invalid format: HH:MM-HH:MM'),
  check_in: z.object({
    search_range: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Invalid format: HH:MM-HH:MM'),
    shift_start: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid format: HH:MM:SS'),
    on_time_cutoff: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid format: HH:MM:SS'),
    late_threshold: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid format: HH:MM:SS'),
  }),
  check_out: z.object({
    search_range: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Invalid format: HH:MM-HH:MM'),
  }),
});

const ShiftsSchema = z.object({
  A: ShiftSchema,
  B: ShiftSchema,
  C: ShiftSchema,
});

type ShiftFormData = z.infer<typeof ShiftSchema>;
type ShiftsFormData = z.infer<typeof ShiftsSchema>;

interface ShiftConfigTabProps {
  onNotification: (type: 'success' | 'error', message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ShiftConfigTab({
  onNotification,
  isLoading,
  setIsLoading,
}: ShiftConfigTabProps) {
  const [initialData, setInitialData] = useState<ShiftsFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<ShiftsFormData>({
    resolver: zodResolver(ShiftsSchema),
    defaultValues: {
      A: {
        name: 'Morning',
        window: '06:00-14:00',
        check_in: {
          search_range: '05:30-06:35',
          shift_start: '06:00:00',
          on_time_cutoff: '06:04:59',
          late_threshold: '06:05:00',
        },
        check_out: {
          search_range: '13:30-14:35',
        },
      },
      B: {
        name: 'Afternoon',
        window: '14:00-22:00',
        check_in: {
          search_range: '13:30-14:35',
          shift_start: '14:00:00',
          on_time_cutoff: '14:04:59',
          late_threshold: '14:05:00',
        },
        check_out: {
          search_range: '21:30-22:35',
        },
      },
      C: {
        name: 'Night',
        window: '22:00-06:00',
        check_in: {
          search_range: '21:30-23:05',
          shift_start: '22:00:00',
          on_time_cutoff: '22:04:59',
          late_threshold: '22:05:00',
        },
        check_out: {
          search_range: '05:30-06:35',
        },
      },
    },
  });

  useEffect(() => {
    loadShifts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShifts = async () => {
    try {
      const response = await fetch('/api/v1/config/shifts');
      if (!response.ok) throw new Error('Failed to load shifts');

      const result = await response.json();
      if (result.success && result.data) {
        const shiftsData = result.data.shifts;
        if (shiftsData) {
          // Fill missing data with defaults
          const completeData: ShiftsFormData = {
            A: { ...getShiftDefaults('A'), ...shiftsData.A },
            B: { ...getShiftDefaults('B'), ...shiftsData.B },
            C: { ...getShiftDefaults('C'), ...shiftsData.C },
          };
          reset(completeData);
          setInitialData(completeData);
        }
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
      onNotification('error', 'Failed to load shift configuration');
    }
  };

  const getShiftDefaults = (shiftLetter: string): Omit<ShiftFormData, 'window'> => {
    const defaults = {
      A: { name: 'Morning', check_in: { search_range: '05:30-06:35', shift_start: '06:00:00', on_time_cutoff: '06:04:59', late_threshold: '06:05:00' }, check_out: { search_range: '13:30-14:35' } },
      B: { name: 'Afternoon', check_in: { search_range: '13:30-14:35', shift_start: '14:00:00', on_time_cutoff: '14:04:59', late_threshold: '14:05:00' }, check_out: { search_range: '21:30-22:35' } },
      C: { name: 'Night', check_in: { search_range: '21:30-23:05', shift_start: '22:00:00', on_time_cutoff: '22:04:59', late_threshold: '22:05:00' }, check_out: { search_range: '05:30-06:35' } },
    };
    return defaults[shiftLetter as keyof typeof defaults];
  };

  const onSubmit = async (data: ShiftsFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/config/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts: data }),
      });

      const result = await response.json();

      if (result.success) {
        onNotification('success', 'Shift configuration updated successfully');
        setInitialData(data);
      } else {
        onNotification('error', result.error || 'Failed to save shift configuration');
      }
    } catch (error) {
      console.error('Error saving shift configuration:', error);
      onNotification('error', 'Network error while saving shift configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    const defaults: ShiftsFormData = {
      A: {
        name: 'Morning',
        window: '06:00-14:00',
        check_in: {
          search_range: '05:30-06:35',
          shift_start: '06:00:00',
          on_time_cutoff: '06:04:59',
          late_threshold: '06:05:00',
        },
        check_out: {
          search_range: '13:30-14:35',
        },
      },
      B: {
        name: 'Afternoon',
        window: '14:00-22:00',
        check_in: {
          search_range: '13:30-14:35',
          shift_start: '14:00:00',
          on_time_cutoff: '14:04:59',
          late_threshold: '14:05:00',
        },
        check_out: {
          search_range: '21:30-22:35',
        },
      },
      C: {
        name: 'Night',
        window: '22:00-06:00',
        check_in: {
          search_range: '21:30-23:05',
          shift_start: '22:00:00',
          on_time_cutoff: '22:04:59',
          late_threshold: '22:05:00',
        },
        check_out: {
          search_range: '05:30-06:35',
        },
      },
    };
    reset(defaults);
  };

  const ShiftEditor = ({ shiftLetter }: { shiftLetter: keyof ShiftsFormData }) => {
    const shiftData = watch(shiftLetter);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-nb-3">
            <div className={`w-8 h-8 flex items-center justify-center rounded-nb bg-nb-blue text-nb-white font-bold text-sm`}>
              {shiftLetter}
            </div>
            {shiftData.name} Shift
          </CardTitle>
          <CardDescription>
            Configure check-in and check-out times for {shiftData.name.toLowerCase()} shift
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-nb-6">
          {/* Shift Window */}
          <div>
            <label className="mb-nb-2 block text-sm font-bold uppercase text-nb-black">
              Shift Window
            </label>
            <Input
              {...register(`${shiftLetter}.window` as const)}
              placeholder="HH:MM-HH:MM"
              className="font-mono"
              disabled={isLoading}
            />
            {errors[shiftLetter]?.window && (
              <p className="mt-nb-2 text-sm text-nb-red">{errors[shiftLetter]?.window?.message}</p>
            )}
          </div>

          {/* Check-in Settings */}
          <div>
            <h4 className="mb-nb-4 font-bold uppercase text-nb-black flex items-center gap-nb-2">
              <Clock className="h-4 w-4" />
              Check-in Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-nb-4">
              <div>
                <label className="mb-nb-2 block text-xs font-bold uppercase text-nb-gray-700">
                  Search Range
                </label>
                <Input
                  {...register(`${shiftLetter}.check_in.search_range` as const)}
                  placeholder="HH:MM-HH:MM"
                  className="font-mono text-sm"
                  disabled={isLoading}
                />
                {errors[shiftLetter]?.check_in?.search_range && (
                  <p className="mt-nb-2 text-sm text-nb-red">{errors[shiftLetter]?.check_in?.search_range?.message}</p>
                )}
              </div>
              <div>
                <label className="mb-nb-2 block text-xs font-bold uppercase text-nb-gray-700">
                  Shift Start
                </label>
                <Input
                  {...register(`${shiftLetter}.check_in.shift_start` as const)}
                  placeholder="HH:MM:SS"
                  className="font-mono text-sm"
                  disabled={isLoading}
                />
                {errors[shiftLetter]?.check_in?.shift_start && (
                  <p className="mt-nb-2 text-sm text-nb-red">{errors[shiftLetter]?.check_in?.shift_start?.message}</p>
                )}
              </div>
              <div>
                <label className="mb-nb-2 block text-xs font-bold uppercase text-nb-gray-700">
                  On-time Cutoff
                </label>
                <Input
                  {...register(`${shiftLetter}.check_in.on_time_cutoff` as const)}
                  placeholder="HH:MM:SS"
                  className="font-mono text-sm"
                  disabled={isLoading}
                />
                {errors[shiftLetter]?.check_in?.on_time_cutoff && (
                  <p className="mt-nb-2 text-sm text-nb-red">{errors[shiftLetter]?.check_in?.on_time_cutoff?.message}</p>
                )}
              </div>
              <div>
                <label className="mb-nb-2 block text-xs font-bold uppercase text-nb-gray-700">
                  Late Threshold
                </label>
                <Input
                  {...register(`${shiftLetter}.check_in.late_threshold` as const)}
                  placeholder="HH:MM:SS"
                  className="font-mono text-sm"
                  disabled={isLoading}
                />
                {errors[shiftLetter]?.check_in?.late_threshold && (
                  <p className="mt-nb-2 text-sm text-nb-red">{errors[shiftLetter]?.check_in?.late_threshold?.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Check-out Settings */}
          <div>
            <h4 className="mb-nb-4 font-bold uppercase text-nb-black flex items-center gap-nb-2">
              <Clock className="h-4 w-4" />
              Check-out Settings
            </h4>
            <div>
              <label className="mb-nb-2 block text-xs font-bold uppercase text-nb-gray-700">
                Search Range
              </label>
              <Input
                {...register(`${shiftLetter}.check_out.search_range` as const)}
                placeholder="HH:MM-HH:MM"
                className="font-mono text-sm max-w-xs"
                disabled={isLoading}
              />
              {errors[shiftLetter]?.check_out?.search_range && (
                <p className="mt-nb-2 text-sm text-nb-red">{errors[shiftLetter]?.check_out?.search_range?.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-nb-8">
      {/* Shift Configuration Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-nb-8">
          <ShiftEditor shiftLetter="A" />
          <ShiftEditor shiftLetter="B" />
          <ShiftEditor shiftLetter="C" />
        </div>

        {/* Action Buttons */}
        <Card variant="warning">
          <CardContent className="p-nb-6">
            <div className="flex flex-col sm:flex-row gap-nb-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !isDirty}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-nb-2" />
                {isLoading ? 'Saving...' : 'Save All Shifts'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetToDefaults}
                disabled={isLoading}
                className="flex-1 sm:flex-initial"
              >
                <RotateCcw className="h-4 w-4 mr-nb-2" />
                Reset to Defaults
              </Button>
            </div>
            {!isDirty && initialData && (
              <p className="mt-nb-4 text-sm text-nb-gray-600">
                No changes to save. Shifts are currently saved with the settings shown above.
              </p>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Help Section */}
      <Card variant="default">
        <CardContent className="p-nb-6">
          <h4 className="mb-nb-4 font-bold uppercase text-nb-black">Time Format Guidelines</h4>
          <div className="space-y-nb-3 text-sm text-nb-gray-700">
            <div>
              <strong>Search Range:</strong> HH:MM-HH:MM (e.g., 05:30-06:35)
            </div>
            <div>
              <strong>Shift Start:</strong> HH:MM:SS (e.g., 06:00:00)
            </div>
            <div>
              <strong>On-time Cutoff:</strong> HH:MM:SS (e.g., 06:04:59)
            </div>
            <div>
              <strong>Late Threshold:</strong> HH:MM:SS (e.g., 06:05:00)
            </div>
            <div className="mt-nb-4 p-nb-4 bg-nb-yellow/20 border-nb-2 border-nb-yellow rounded-nb">
              <strong>Note:</strong> Changes to shift times will immediately affect attendance processing.
              Ensure all time ranges are logical and non-overlapping between shifts.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}