'use client';

import { CalendarIcon, Filter, Folder, User, X } from 'lucide-react';
import { useState } from 'react';

import { DatePicker } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { ActivityAction, ActivityEntityType } from '../types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export type ActivityFilterScope = 'all_workspace' | 'my_tasks' | 'my_projects' | 'team_activity';

interface ActivityLogFiltersProps {
  filters: {
    entityType?: ActivityEntityType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    action?: ActivityAction;
    projectId?: string;
    scope?: ActivityFilterScope;
  };
  onFiltersChange: (filters: ActivityLogFiltersProps['filters']) => void;
  showScopeFilter?: boolean;
}

export const ActivityLogFilters = ({ filters, onFiltersChange, showScopeFilter = false }: ActivityLogFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const { data: members } = useGetMembers({ workspaceId, includeInactive: 'true' });
  const { data: projects } = useGetProjects({ workspaceId });

  const handleFilterChange = (key: keyof ActivityLogFiltersProps['filters'], value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="size-5 text-primary" />
          Filters
        </CardTitle>
        <CardDescription className="mt-1">
          Filter activity logs by type, user, date, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {showScopeFilter && (
            <Select
              value={filters.scope || 'all_workspace'}
              onValueChange={(value) => handleFilterChange('scope', value === 'all_workspace' ? undefined : value)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Scope" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_workspace">All Workspace</SelectItem>
                <SelectItem value="my_tasks">My Tasks</SelectItem>
                <SelectItem value="my_projects">My Projects</SelectItem>
                <SelectItem value="team_activity">Team Activity</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.entityType || 'all'}
            onValueChange={(value) => handleFilterChange('entityType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[180px]">
              <div className="flex items-center">
                <Folder className="mr-2 size-4" />
                <SelectValue placeholder="Entity Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectSeparator />
              {Object.values(ActivityEntityType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.action || 'all'}
            onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Action" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectSeparator />
              {Object.values(ActivityAction).map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.userId || 'all'}
            onValueChange={(value) => handleFilterChange('userId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[180px]">
              <div className="flex items-center">
                <User className="mr-2 size-4" />
                <SelectValue placeholder="User" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectSeparator />
              {members?.documents?.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.name || member.email || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.projectId || 'all'}
            onValueChange={(value) => handleFilterChange('projectId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[180px]">
              <div className="flex items-center">
                <Folder className="mr-2 size-4" />
                <SelectValue placeholder="Project" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectSeparator />
              {projects?.documents?.map((project) => (
                <SelectItem key={project.$id} value={project.$id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePicker
            placeholder="Start Date"
            className="h-9 w-full sm:w-[180px]"
            value={filters.startDate ? new Date(filters.startDate) : undefined}
            onChange={(date) => handleFilterChange('startDate', date ? date.toISOString() : undefined)}
            showReset
          />

          <DatePicker
            placeholder="End Date"
            className="h-9 w-full sm:w-[180px]"
            value={filters.endDate ? new Date(filters.endDate) : undefined}
            onChange={(date) => handleFilterChange('endDate', date ? date.toISOString() : undefined)}
            showReset
          />

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
              <X className="mr-2 size-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
