/**
 * Roadmap View Component
 * 
 * Orchestrates the structured two-page user flow:
 * - Step 2 & 3: Dedicated Project Overview Page (details, scope, calm feasibility, tech stack, skill gaps, and "Let's Explore Your Roadmap" CTA)
 * - Step 4: Dedicated Roadmap Phases Page (compact phased execution roadmap and interactive task tracking)
 */

import ProjectOverviewView from './ProjectOverviewView';
import RoadmapPhasesView from './RoadmapPhasesView';

export default function RoadmapView({
  roadmapData,
  roadmapStep = 'overview',
  onStepChange,
  taskStatuses = {},
  onUpdateTaskStatus,
  onBackToProjects,
  onBackToDashboard,
  onDeleteRoadmap,
}) {
  if (!roadmapData) return null;

  if (roadmapStep === 'phases') {
    return (
      <RoadmapPhasesView
        roadmapData={roadmapData}
        taskStatuses={taskStatuses}
        onUpdateTaskStatus={onUpdateTaskStatus}
        onBackToOverview={() => {
          if (onStepChange) onStepChange('overview');
        }}
        onBackToProjects={onBackToProjects}
        onNewPlan={onBackToDashboard}
        onDeleteRoadmap={onDeleteRoadmap}
      />
    );
  }

  return (
    <ProjectOverviewView
      roadmapData={roadmapData}
      onExploreRoadmap={() => {
        if (onStepChange) onStepChange('phases');
      }}
      onBackToProjects={onBackToProjects}
      onNewPlan={onBackToDashboard}
      onDeleteRoadmap={onDeleteRoadmap}
    />
  );
}
