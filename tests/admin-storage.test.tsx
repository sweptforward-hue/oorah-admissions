import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AdminStoragePage from '@/app/admin/storage/page'
import * as adminActions from '@/lib/admin/actions'

vi.mock('@/lib/admin/actions', () => ({
  getDriveStorageConfig: vi.fn(),
  updateDriveFolder: vi.fn(),
  testDriveConnection: vi.fn(),
  checkDriveFolderHealthAction: vi.fn(),
}))

describe('AdminStoragePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(window, 'prompt').mockImplementation(() => null)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('loads and displays drive storage configuration and folder health on mount', async () => {
    vi.mocked(adminActions.getDriveStorageConfig).mockResolvedValueOnce({
      folderId: 'folder_abc123',
      connection: {
        success: true,
        message: 'Google Cloud Platform OAuth connection verified successfully (service@oorah.iam.gserviceaccount.com).',
        user: { emailAddress: 'service@oorah.iam.gserviceaccount.com' },
      },
      folderHealth: {
        success: true,
        message: "Folder 'Oorah Root' (ID: folder_abc123) is active and accessible.",
        folder: { id: 'folder_abc123', name: 'Oorah Root', mimeType: 'application/vnd.google-apps.folder' },
      },
    })

    await act(async () => {
      render(<AdminStoragePage />)
    })

    expect(screen.getByText('Google Drive & Document Storage')).toBeInTheDocument()
    expect(screen.getAllByText('folder_abc123').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/Google Cloud Platform OAuth connection verified successfully/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Folder 'Oorah Root' \(ID: folder_abc123\) is active and accessible\./i)
    ).toBeInTheDocument()
  })

  it('handles testing service connection when clicked', async () => {
    vi.mocked(adminActions.getDriveStorageConfig).mockResolvedValueOnce({
      folderId: 'folder_abc123',
      connection: { success: true, message: 'Connected' },
      folderHealth: { success: true, message: 'Healthy' },
    })
    vi.mocked(adminActions.testDriveConnection).mockResolvedValueOnce({
      success: true,
      message: 'Connection re-verified successfully.',
    })

    await act(async () => {
      render(<AdminStoragePage />)
    })

    const testBtn = screen.getByRole('button', { name: 'Test Connection' })
    await act(async () => {
      fireEvent.click(testBtn)
    })

    expect(adminActions.testDriveConnection).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/Connection re-verified successfully\./i)).toBeInTheDocument()
    })
  })

  it('handles updating folder ID and checking new folder health', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('new_folder_789')
    vi.mocked(adminActions.getDriveStorageConfig).mockResolvedValueOnce({
      folderId: 'old_folder',
      connection: { success: true, message: 'Connected' },
      folderHealth: { success: true, message: 'Healthy' },
    })
    vi.mocked(adminActions.updateDriveFolder).mockResolvedValueOnce({ success: true })
    vi.mocked(adminActions.checkDriveFolderHealthAction).mockResolvedValueOnce({
      success: true,
      message: "Folder 'New Root' (ID: new_folder_789) is active and accessible.",
      folder: { id: 'new_folder_789', name: 'New Root', mimeType: 'application/vnd.google-apps.folder' },
    })

    await act(async () => {
      render(<AdminStoragePage />)
    })

    const updateBtn = screen.getByRole('button', { name: 'Update Folder' })
    await act(async () => {
      fireEvent.click(updateBtn)
    })

    expect(adminActions.updateDriveFolder).toHaveBeenCalledWith('new_folder_789')
    expect(adminActions.checkDriveFolderHealthAction).toHaveBeenCalledWith('new_folder_789')
    expect(screen.getAllByText('new_folder_789').length).toBeGreaterThan(0)
  })
})
