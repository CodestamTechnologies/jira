'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExpenseCategory, ExpenseStatus } from '../types';
import { formatCategoryForDisplay } from '../utils/expense-helpers';
import { X } from 'lucide-react';
import type { Project } from '@/features/projects/types';
import type { ExpenseFiltersInput } from '../schema';

interface ExpenseFiltersProps {
  filters: ExpenseFiltersInput;
  onFiltersChange: (filters: ExpenseFiltersInput) => void;
  projects: Project[];
}

/**
 * Expense filters component
 * Allows filtering by date range, category, project, and status
 */
export const ExpenseFilters = ({ filters, onFiltersChange, projects }: ExpenseFiltersProps) => {
  const handleFilterChange = (key: keyof ExpenseFiltersInput, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      workspaceId: filters.workspaceId,
      projectId: undefined,
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      status: undefined,
    });
  };

  const hasActiveFilters = !!(
    filters.projectId ||
    filters.startDate ||
    filters.endDate ||
    filters.category ||
    filters.status
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={filters.projectId || 'all'}
              onValueChange={(value) => handleFilterChange('projectId', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.$id} value={project.$id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                        {Object.values(ExpenseCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {formatCategoryForDisplay(category)}
                          </SelectItem>
                        ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(ExpenseStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
