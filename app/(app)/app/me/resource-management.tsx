"use client";

import { useState, useTransition } from "react";
import { Trash2, Users, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UsageStats {
  habits: number;
  groups: number;
  groupMemberCounts: Record<string, number>;
  reminders: number;
}

interface DowngradeRequirements {
  canDowngrade: boolean;
  issues: {
    habits: { current: number; limit: number; needsReduction: number };
    groups: { current: number; limit: number; needsReduction: number };
    groupMembers: { groupId: string; groupName: string; current: number; limit: number; needsReduction: number }[];
  };
}

interface ResourceManagementProps {
  currentTier: string;
  targetTier: 'free' | 'pro' | 'plus';
  usageStats: UsageStats;
  downgradeRequirements: DowngradeRequirements;
  onDeleteHabit?: (habitId: string) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;
  onRemoveMember?: (groupId: string, memberId: string) => Promise<void>;
}

export function ResourceManagement({
  currentTier,
  targetTier,
  usageStats,
  downgradeRequirements,
  onDeleteHabit,
  onDeleteGroup,
  onRemoveMember,
}: ResourceManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<{
    type: 'habit' | 'group' | 'member';
    id: string;
    name: string;
  } | null>(null);

  const getTierLimits = (tier: string) => {
    switch (tier) {
      case 'free':
        return { habits: 5, groups: 1, members: 5 };
      case 'pro':
        return { habits: 15, groups: 3, members: 15 };
      case 'plus':
        return { habits: -1, groups: -1, members: -1 };
      default:
        return { habits: 3, groups: 1, members: 5 };
    }
  };

  const currentLimits = getTierLimits(currentTier);
  const targetLimits = getTierLimits(targetTier);

  const handleDeleteResource = (type: 'habit' | 'group' | 'member', id: string, name: string) => {
    setShowDeleteConfirmation({ type, id, name });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirmation) return;

    startTransition(async () => {
      try {
        switch (showDeleteConfirmation.type) {
          case 'habit':
            if (onDeleteHabit) await onDeleteHabit(showDeleteConfirmation.id);
            break;
          case 'group':
            if (onDeleteGroup) await onDeleteGroup(showDeleteConfirmation.id);
            break;
          case 'member':
            if (onRemoveMember) await onRemoveMember(showDeleteConfirmation.id, 'member-id'); // TODO: Pass actual member ID
            break;
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    });

    setShowDeleteConfirmation(null);
  };

  return (
    <div className="space-y-6">
      {/* Current Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Current Usage vs {targetTier.toUpperCase()} Limits
          </CardTitle>
          <CardDescription>
            Manage your resources to downgrade to the {targetTier} plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Habits Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Habits</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {usageStats.habits} / {targetLimits.habits === -1 ? '∞' : targetLimits.habits}
                </span>
                {usageStats.habits > (targetLimits.habits === -1 ? 999 : targetLimits.habits) && (
                  <Badge variant="destructive" className="text-xs">
                    {usageStats.habits - (targetLimits.habits === -1 ? 999 : targetLimits.habits)} over limit
                  </Badge>
                )}
              </div>
            </div>
            {targetLimits.habits !== -1 && (
              <Progress
                value={Math.min((usageStats.habits / targetLimits.habits) * 100, 100)}
                className="h-2"
              />
            )}
          </div>

          <Separator />

          {/* Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Groups</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {usageStats.groups} / {targetLimits.groups === -1 ? '∞' : targetLimits.groups}
                </span>
                {usageStats.groups > (targetLimits.groups === -1 ? 999 : targetLimits.groups) && (
                  <Badge variant="destructive" className="text-xs">
                    {usageStats.groups - (targetLimits.groups === -1 ? 999 : targetLimits.groups)} over limit
                  </Badge>
                )}
              </div>
            </div>
            {targetLimits.groups !== -1 && (
              <Progress
                value={Math.min((usageStats.groups / targetLimits.groups) * 100, 100)}
                className="h-2"
              />
            )}
          </div>

          {/* Action Items */}
          {!downgradeRequirements.canDowngrade && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You need to reduce your usage before downgrading to {targetTier}.
                {downgradeRequirements.issues.habits.needsReduction > 0 &&
                  ` Delete ${downgradeRequirements.issues.habits.needsReduction} habits.`
                }
                {downgradeRequirements.issues.groups.needsReduction > 0 &&
                  ` Delete ${downgradeRequirements.issues.groups.needsReduction} groups.`
                }
                {downgradeRequirements.issues.groupMembers.length > 0 &&
                  ` Remove members from ${downgradeRequirements.issues.groupMembers.length} groups.`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Resource Management Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              Manage Habits
            </Button>
            <Button variant="outline" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              Manage Groups
            </Button>
            <Button variant="outline" className="flex-1">
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ready to Downgrade */}
      {downgradeRequirements.canDowngrade && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Ready to Downgrade</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Your usage is within {targetTier} limits. You can safely downgrade now.
            </p>
            <Button className="mt-4 w-full" size="lg">
              Continue to Downgrade
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
