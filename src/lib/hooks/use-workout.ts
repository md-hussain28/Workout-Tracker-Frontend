import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type WorkoutWithSets, type WorkoutSetCreate, type WorkoutSet } from "@/lib/api";

export function useWorkout(id: number) {
    return useQuery({
        queryKey: ["workout", id],
        queryFn: () => api.workouts.get(id),
    });
}

export function useAddSet(workoutId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: WorkoutSetCreate) => api.workouts.addSet(workoutId, payload),
        onMutate: async (newSet) => {
            await queryClient.cancelQueries({ queryKey: ["workout", workoutId] });
            const previous = queryClient.getQueryData<WorkoutWithSets>(["workout", workoutId]);

            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                const optimisticSet: WorkoutSet = {
                    id: -Date.now(), // temp id
                    workout_id: workoutId,
                    exercise_id: newSet.exercise_id,
                    set_order: newSet.set_order ?? 0,
                    weight: newSet.weight ?? null,
                    reps: newSet.reps ?? null,
                    duration_seconds: newSet.duration_seconds ?? null,
                    notes: newSet.notes ?? null,
                    set_label: newSet.set_label ?? null,
                    is_pr: false,
                    pr_type: null,
                };
                return {
                    ...old,
                    sets: [...old.sets, optimisticSet],
                };
            });

            return { previous };
        },
        onError: (_err, _newSet, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["workout", workoutId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
        },
    });
}

export function useEndWorkout(workoutId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            api.workouts.update(workoutId, {
                ended_at: new Date().toISOString(),
            }),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["workout", workoutId] });
            const previous = queryClient.getQueryData<WorkoutWithSets>(["workout", workoutId]);

            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                const now = new Date().toISOString();
                const duration = Math.round(
                    (new Date(now).getTime() - new Date(old.started_at).getTime()) / 1000
                );
                return { ...old, ended_at: now, duration_seconds: duration };
            });

            return { previous };
        },
        onError: (_err, _v, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["workout", workoutId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            queryClient.invalidateQueries({ queryKey: ["streak"] });
        },
    });
}
