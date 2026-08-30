export interface MetricCardProps {
  id: string;
  title: string;
  subtitle: string;
  targetDescription: string;
  iconName: 'dollar' | 'layers' | 'activity' | 'status';
}

export interface CandidateStockMock {
  ticker: string;
  name: string;
  subIndustry: string;
  marketCap: string;
}

export interface PortfolioAllocationMock {
  ticker: string;
  name: string;
  targetWeight: string;
  targetAmount: string;
  subIndustry: string;
}
