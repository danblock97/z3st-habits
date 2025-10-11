import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  HabitDependency,
  HabitDependencyRelation,
  DependencyTreeNode,
  DependencyType,
} from '@/app/(app)/app/habits/types';

/**
 * Fetches all parent habits (dependencies) for a given habit
 */
export async function getHabitParents(
  supabase: SupabaseClient,
  habitId: string
): Promise<HabitDependencyRelation[]> {
  const { data, error } = await supabase.rpc('get_habit_parents', {
    p_habit_id: habitId,
  });

  if (error) {
    console.error('Error fetching habit parents:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    habitId: item.habit_id,
    title: item.title,
    emoji: item.emoji,
    dependencyType: item.dependency_type as DependencyType,
  }));
}

/**
 * Fetches all child habits (dependents) for a given habit
 */
export async function getHabitChildren(
  supabase: SupabaseClient,
  habitId: string
): Promise<HabitDependencyRelation[]> {
  const { data, error } = await supabase.rpc('get_habit_children', {
    p_habit_id: habitId,
  });

  if (error) {
    console.error('Error fetching habit children:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    habitId: item.habit_id,
    title: item.title,
    emoji: item.emoji,
    dependencyType: item.dependency_type as DependencyType,
  }));
}

/**
 * Fetches the complete dependency tree for a user
 */
export async function getUserDependencyTree(
  supabase: SupabaseClient,
  userId: string
): Promise<DependencyTreeNode[]> {
  const { data, error } = await supabase.rpc('get_habit_dependency_tree', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching dependency tree:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    parentId: item.parent_id,
    parentTitle: item.parent_title,
    parentEmoji: item.parent_emoji,
    childId: item.child_id,
    childTitle: item.child_title,
    childEmoji: item.child_emoji,
    dependencyType: item.dependency_type as DependencyType,
  }));
}

/**
 * Creates a new habit dependency
 */
export async function createHabitDependency(
  supabase: SupabaseClient,
  parentHabitId: string,
  childHabitId: string,
  dependencyType: DependencyType = 'enables'
): Promise<{ success: boolean; error?: string }> {
  // Check if dependency would create a circular reference
  const { data: wouldCreateCycle, error: checkError } = await supabase.rpc(
    'would_create_circular_dependency',
    {
      p_parent_habit_id: parentHabitId,
      p_child_habit_id: childHabitId,
    }
  );

  if (checkError) {
    return {
      success: false,
      error: 'Failed to validate dependency',
    };
  }

  if (wouldCreateCycle) {
    return {
      success: false,
      error: 'This dependency would create a circular reference',
    };
  }

  // Create the dependency
  const { error: insertError } = await supabase
    .from('habit_dependencies')
    .insert({
      parent_habit_id: parentHabitId,
      child_habit_id: childHabitId,
      dependency_type: dependencyType,
    });

  if (insertError) {
    // Check if it's a duplicate
    if (insertError.code === '23505') {
      return {
        success: false,
        error: 'This dependency already exists',
      };
    }
    return {
      success: false,
      error: insertError.message,
    };
  }

  return { success: true };
}

/**
 * Deletes a habit dependency
 */
export async function deleteHabitDependency(
  supabase: SupabaseClient,
  parentHabitId: string,
  childHabitId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('habit_dependencies')
    .delete()
    .eq('parent_habit_id', parentHabitId)
    .eq('child_habit_id', childHabitId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

/**
 * Checks if a habit has completed its parent dependencies for today
 */
export async function areParentDependenciesMet(
  supabase: SupabaseClient,
  habitId: string,
  localDate: string
): Promise<boolean> {
  // Get all parent habits with 'requires' dependency type
  const { data: parents } = await supabase.rpc('get_habit_parents', {
    p_habit_id: habitId,
  });

  if (!parents || parents.length === 0) {
    return true; // No dependencies, so they're all met
  }

  // Filter to only 'requires' dependencies
  const requiredParents = parents.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => p.dependency_type === 'requires'
  );

  if (requiredParents.length === 0) {
    return true; // No required dependencies
  }

  // Check if all required parents have been completed today
  for (const parent of requiredParents) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('count')
      .eq('habit_id', parent.habit_id)
      .eq('local_date', localDate)
      .maybeSingle();

    if (!checkins || checkins.count === 0) {
      return false; // Parent not completed today
    }
  }

  return true; // All required parents completed
}

/**
 * Gets suggested habits based on what was completed today
 */
export async function getSuggestedHabits(
  supabase: SupabaseClient,
  userId: string,
  localDate: string
): Promise<HabitDependencyRelation[]> {
  // Get all habits completed today
  const { data: completedToday } = await supabase
    .from('checkins')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('local_date', localDate);

  if (!completedToday || completedToday.length === 0) {
    return [];
  }

  const completedHabitIds = completedToday.map((c) => c.habit_id);
  const suggestions: HabitDependencyRelation[] = [];

  // For each completed habit, get its children
  for (const habitId of completedHabitIds) {
    const children = await getHabitChildren(supabase, habitId);

    // Filter to only 'enables' and 'suggests' types
    const enabledChildren = children.filter(
      (c) => c.dependencyType === 'enables' || c.dependencyType === 'suggests'
    );

    suggestions.push(...enabledChildren);
  }

  // Remove duplicates
  const uniqueSuggestions = suggestions.filter(
    (suggestion, index, self) =>
      index === self.findIndex((s) => s.habitId === suggestion.habitId)
  );

  return uniqueSuggestions;
}

/**
 * Checks if a habit is blocked by incomplete dependencies
 */
export async function isHabitBlocked(
  supabase: SupabaseClient,
  habitId: string,
  localDate: string
): Promise<{ blocked: boolean; missingDependencies?: HabitDependencyRelation[] }> {
  const parents = await getHabitParents(supabase, habitId);

  const requiredParents = parents.filter(
    (p) => p.dependencyType === 'requires'
  );

  if (requiredParents.length === 0) {
    return { blocked: false };
  }

  const missingDependencies: HabitDependencyRelation[] = [];

  for (const parent of requiredParents) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('count')
      .eq('habit_id', parent.habitId)
      .eq('local_date', localDate)
      .maybeSingle();

    if (!checkins || checkins.count === 0) {
      missingDependencies.push(parent);
    }
  }

  return {
    blocked: missingDependencies.length > 0,
    missingDependencies: missingDependencies.length > 0 ? missingDependencies : undefined,
  };
}
