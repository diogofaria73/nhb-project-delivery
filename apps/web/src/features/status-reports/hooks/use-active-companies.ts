import { useEffect, useState } from 'react';
import { companyService } from '@/services/company.service';
import type { CompanyResponse } from '@/types';

export function useActiveCompanies() {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    companyService
      .listCompanies({ isActive: true, page: 1, limit: 100 })
      .then((res) => {
        if (!cancelled) setCompanies(res.data);
      })
      .catch(() => {
        if (!cancelled) setCompanies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { companies, loading };
}
