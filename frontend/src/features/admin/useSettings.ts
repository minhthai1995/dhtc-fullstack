import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, saveSettings } from './settings.api'

export function useSettings() {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: getSettings,
  })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
    },
  })
}
