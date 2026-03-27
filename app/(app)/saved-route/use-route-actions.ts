/**
 * Custom hook for route detail screen actions (rename, delete, undo).
 * Extracted to keep the screen file lean (<150 lines).
 */

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { Notifier } from 'react-native-notifier'

import {
  useRenameRoute,
  useSoftDeleteRoute,
  useUndoDeleteRoute,
} from '../../../hooks/use-saved-routes'
import { showSuccessNotification } from '../../../lib/notifier-helpers'
import type { Id } from '../../../convex/_generated/dataModel'

const UNDO_TOAST_DURATION = 5000

export const useRouteActions = (savedRouteId: string | null) => {
  const router = useRouter()
  const rename = useRenameRoute()
  const softDelete = useSoftDeleteRoute()
  const undoDelete = useUndoDeleteRoute()

  const [renameDialogVisible, setRenameDialogVisible] = useState(false)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didUndoRef = useRef(false)

  const openRenameDialog = useCallback(() => setRenameDialogVisible(true), [])
  const closeRenameDialog = useCallback(() => setRenameDialogVisible(false), [])
  const openDeleteDialog = useCallback(() => setDeleteDialogVisible(true), [])
  const closeDeleteDialog = useCallback(() => setDeleteDialogVisible(false), [])

  const handleRename = useCallback(
    async (newName: string) => {
      if (!savedRouteId) return
      await rename.run({
        savedRouteId: savedRouteId as Id<'saved_routes'>,
        name: newName,
      })
      // Always close dialog — errors are shown via notification toast
      setRenameDialogVisible(false)
    },
    [savedRouteId, rename]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!savedRouteId) return
    didUndoRef.current = false
    setDeleteDialogVisible(false)

    const result = await softDelete.run({
      savedRouteId: savedRouteId as Id<'saved_routes'>,
    })
    if (result === null) return

    Notifier.showNotification({
      title: 'Route deleted',
      description: 'Tap to undo.',
      duration: UNDO_TOAST_DURATION,
      onPress: async () => {
        didUndoRef.current = true
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current)
          undoTimerRef.current = null
        }
        Notifier.hideNotification()
        await undoDelete.run({
          savedRouteId: savedRouteId as Id<'saved_routes'>,
        })
        showSuccessNotification('Route restored')
      },
      onHidden: () => {
        if (!didUndoRef.current) {
          router.back()
        }
      },
    })

    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null
    }, UNDO_TOAST_DURATION)
  }, [savedRouteId, softDelete, undoDelete, router])

  return {
    renameDialogVisible,
    deleteDialogVisible,
    openRenameDialog,
    closeRenameDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleRename,
    handleDeleteConfirm,
    isRenaming: rename.isRunning,
    isDeleting: softDelete.isRunning,
  }
}
