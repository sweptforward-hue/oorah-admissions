import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

describe('DashboardPage', () => {
  it('renders admissions dashboard title and metrics', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Admissions Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Total Applicants')).toBeInTheDocument()
    expect(screen.getByText('Acceptance Rate')).toBeInTheDocument()
    expect(screen.getByText('Applicant Status Distribution')).toBeInTheDocument()
  })

  it('renders status breakdown legend items', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByText('VAAD Review')).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })
})
