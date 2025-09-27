import ResultsDashboard from '../components/ResultsDashboard'
import { mockApiResponse } from '../lib/mock-data'

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ResultsDashboard data={mockApiResponse} />
    </div>
  )
}
