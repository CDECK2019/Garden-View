import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { Project } from '../types';

const STORAGE_KEY = 'terraform_projects_v2';

export function usePersistedProjects() {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localforage on mount
  useEffect(() => {
    localforage.getItem<Project[]>(STORAGE_KEY).then((stored) => {
      if (stored && Array.isArray(stored)) {
        setProjectsState(stored);
      }
      setIsLoaded(true);
    }).catch((err) => {
      console.warn('TerraForm: Failed to load from localforage', err);
      setIsLoaded(true);
    });
  }, []);

  // Debounced write to localforage
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      localforage.setItem(STORAGE_KEY, projects).catch(err => {
        console.error('TerraForm: Could not persist projects to localforage.', err);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [projects, isLoaded]);

  const setProjects = useCallback((updater: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState(updater);
  }, []);

  return { projects, setProjects };
}
