export interface PublicProjectMatch { id: string; country_code: string; technology: string }

/** Associations are derived only from public country and technology categories. */
export function relatedProjects(item: { country_codes: string[]; technologies: string[] }, projects: PublicProjectMatch[]): string[] {
  return projects.filter(project => item.country_codes.includes(project.country_code.trim().toUpperCase())
    && item.technologies.includes(project.technology)).map(project => project.id);
}