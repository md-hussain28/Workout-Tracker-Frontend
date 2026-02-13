import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type WorkoutWithSets, type WorkoutSetCreate, type WorkoutSet, type WorkoutSetUpdate } from "@/lib/api";

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
            const tempId = -Date.now();

            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                const optimisticSet: WorkoutSet = {
                    id: tempId,
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

            return { previous, tempId };
        },
        onSuccess: (savedSet, _vars, context) => {
            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                // Replace the temporary optimistic set with the real one from server
                return {
                    ...old,
                    sets: old.sets.map((s) =>
                        s.id === context?.tempId ? savedSet : s.id === savedSet.id ? savedSet : s
                    ),
                };
            });
        },
        onSettled: () => {
            // Invalidate to ensure consistency, but the immediate UI is handled by onSuccess
            queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
        },
    });
}

export function useUpdateSet(workoutId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ setId, body }: { setId: number; body: WorkoutSetUpdate }) =>
            api.workouts.updateSet(workoutId, setId, body),
        onMutate: async ({ setId, body }) => {
            await queryClient.cancelQueries({ queryKey: ["workout", workoutId] });
            const previous = queryClient.getQueryData<WorkoutWithSets>(["workout", workoutId]);

            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    sets: old.sets.map((s) =>
                        s.id === setId ? { ...s, ...body } : s
                    ),
                };
            });

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["workout", workoutId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
        },
    });
}

export function useDeleteSet(workoutId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (setId: number) => api.workouts.deleteSet(workoutId, setId),
        onMutate: async (setId) => {
            await queryClient.cancelQueries({ queryKey: ["workout", workoutId] });
            const previous = queryClient.getQueryData<WorkoutWithSets>(["workout", workoutId]);

            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    sets: old.sets.filter((s) => s.id !== setId),
                };
            });

            return { previous };
        },
        onError: (_err, _setId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["workout", workoutId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
        },
    });
}

export function useDeleteExerciseSets(workoutId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (setIds: number[]) => {
            await Promise.all(setIds.map((id) => api.workouts.deleteSet(workoutId, id)));
        },
        onMutate: async (setIds) => {
            await queryClient.cancelQueries({ queryKey: ["workout", workoutId] });
            const previous = queryClient.getQueryData<WorkoutWithSets>(["workout", workoutId]);

            queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    sets: old.sets.filter((s) => !setIds.includes(s.id)),
                };
            });

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["workout", workoutId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
            queryClient.invalidateQueries({ queryKey: ["streak"] });
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

export function useDeleteWorkout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api.workouts.delete(id),
        onMutate: async (id) => {
            // Optimistically remove from list
            await queryClient.cancelQueries({ queryKey: ["workouts"] });
            const previous = queryClient.getQueryData(["workouts"]);
            queryClient.setQueryData<any[]>(["workouts"], (old) => {
                return Array.isArray(old) ? old.filter((w) => w.id !== id) : old;
            });
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["workouts"], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            queryClient.invalidateQueries({ queryKey: ["streak"] });
        },
    });
}
