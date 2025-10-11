'use client';

import { useState, useTransition, useEffect } from 'react';
import { Link2, Plus, Trash2, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/toast';
import type {
  HabitSummary,
  HabitDependencyRelation,
  DependencyType,
} from './types';
import {
  addHabitDependency,
  removeHabitDependency,
  fetchHabitDependencies,
} from './actions';
import { cn } from '@/lib/utils';

type HabitDependenciesManagerProps = {
  currentHabit: HabitSummary;
  availableHabits: HabitSummary[];
};

const DEPENDENCY_TYPE_LABELS: Record<
  DependencyType,
  { label: string; description: string; color: string }
> = {
  enables: {
    label: 'Enables',
    description: 'Suggests this habit after completion (soft)',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  requires: {
    label: 'Requires',
    description: 'Must be completed first (blocks child)',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  suggests: {
    label: 'Suggests',
    description: 'Related habit (visual only)',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
};

export function HabitDependenciesManager({
  currentHabit,
  availableHabits,
}: HabitDependenciesManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parents, setParents] = useState<HabitDependencyRelation[]>([]);
  const [children, setChildren] = useState<HabitDependencyRelation[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [dependencyType, setDependencyType] = useState<DependencyType>('enables');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Load dependencies when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setIsLoading(true);
    try {
      const result = await fetchHabitDependencies(currentHabit.id);
      if (result.success) {
        setParents(result.parents);
        setChildren(result.children);
      }
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParent = () => {
    if (!selectedParentId) {
      showToast({
        title: 'Select a habit',
        description: 'Please select a parent habit to create a dependency.',
      });
      return;
    }

    startTransition(async () => {
      const result = await addHabitDependency(
        selectedParentId,
        currentHabit.id,
        dependencyType
      );

      if (result.success) {
        showToast({
          title: 'Dependency added',
          description: result.message,
        });
        setSelectedParentId('');
        await loadDependencies();
      } else {
        showToast({
          title: 'Failed to add dependency',
          description: result.message,
          variant: 'error',
        });
      }
    });
  };

  const handleAddChild = () => {
    if (!selectedChildId) {
      showToast({
        title: 'Select a habit',
        description: 'Please select a child habit to create a dependency.',
      });
      return;
    }

    startTransition(async () => {
      const result = await addHabitDependency(
        currentHabit.id,
        selectedChildId,
        dependencyType
      );

      if (result.success) {
        showToast({
          title: 'Dependency added',
          description: result.message,
        });
        setSelectedChildId('');
        await loadDependencies();
      } else {
        showToast({
          title: 'Failed to add dependency',
          description: result.message,
          variant: 'error',
        });
      }
    });
  };

  const handleRemoveParent = (parentHabitId: string) => {
    startTransition(async () => {
      const result = await removeHabitDependency(parentHabitId, currentHabit.id);

      if (result.success) {
        showToast({
          title: 'Dependency removed',
          description: result.message,
        });
        await loadDependencies();
      } else {
        showToast({
          title: 'Failed to remove dependency',
          description: result.message,
          variant: 'error',
        });
      }
    });
  };

  const handleRemoveChild = (childHabitId: string) => {
    startTransition(async () => {
      const result = await removeHabitDependency(currentHabit.id, childHabitId);

      if (result.success) {
        showToast({
          title: 'Dependency removed',
          description: result.message,
        });
        await loadDependencies();
      } else {
        showToast({
          title: 'Failed to remove dependency',
          description: result.message,
          variant: 'error',
        });
      }
    });
  };

  const getAvailableParents = () => {
    const existingParentIds = new Set(parents.map((p) => p.habitId));
    return availableHabits.filter(
      (h) => h.id !== currentHabit.id && !existingParentIds.has(h.id)
    );
  };

  const getAvailableChildren = () => {
    const existingChildIds = new Set(children.map((c) => c.habitId));
    return availableHabits.filter(
      (h) => h.id !== currentHabit.id && !existingChildIds.has(h.id)
    );
  };

  const hasDependencies = parents.length > 0 || children.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2',
            hasDependencies && 'border-primary text-primary'
          )}
        >
          <Link2 className="h-4 w-4" />
          Dependencies
          {hasDependencies && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {parents.length + children.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentHabit.emoji}</span>
            {currentHabit.title} - Dependencies
          </DialogTitle>
          <DialogDescription>
            Build habit stacks by linking habits together. Use "Requires" to block this habit until parents are completed, or "Enables/Suggests" for soft recommendations.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Parent Dependencies (Required/Blocking) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Parent Habits
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Habits that influence this one (only "Requires" blocks completion)
                  </p>
                </div>
              </div>

              {parents.length > 0 && (
                <div className="space-y-2">
                  {parents.map((parent) => (
                    <div
                      key={parent.habitId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{parent.emoji}</span>
                        <div>
                          <p className="font-medium">{parent.title}</p>
                          <Badge
                            className={cn(
                              'text-xs',
                              DEPENDENCY_TYPE_LABELS[parent.dependencyType].color
                            )}
                          >
                            {DEPENDENCY_TYPE_LABELS[parent.dependencyType].label}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParent(parent.habitId)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select parent habit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableParents().map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        <span className="flex items-center gap-2">
                          <span>{habit.emoji}</span>
                          <span>{habit.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={dependencyType}
                  onValueChange={(v) => setDependencyType(v as DependencyType)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requires">Requires</SelectItem>
                    <SelectItem value="enables">Enables</SelectItem>
                    <SelectItem value="suggests">Suggests</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddParent}
                  disabled={isPending || !selectedParentId}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Child Dependencies (Unlocked by this habit) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Child Habits
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These habits are unlocked when you complete this one
                  </p>
                </div>
              </div>

              {children.length > 0 && (
                <div className="space-y-2">
                  {children.map((child) => (
                    <div
                      key={child.habitId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{child.emoji}</span>
                        <div>
                          <p className="font-medium">{child.title}</p>
                          <Badge
                            className={cn(
                              'text-xs',
                              DEPENDENCY_TYPE_LABELS[child.dependencyType].color
                            )}
                          >
                            {DEPENDENCY_TYPE_LABELS[child.dependencyType].label}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChild(child.habitId)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select child habit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableChildren().map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        <span className="flex items-center gap-2">
                          <span>{habit.emoji}</span>
                          <span>{habit.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={dependencyType}
                  onValueChange={(v) => setDependencyType(v as DependencyType)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enables">Enables</SelectItem>
                    <SelectItem value="requires">Requires</SelectItem>
                    <SelectItem value="suggests">Suggests</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddChild}
                  disabled={isPending || !selectedChildId}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
